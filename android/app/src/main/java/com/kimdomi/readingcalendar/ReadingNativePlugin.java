package com.kimdomi.readingcalendar;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import androidx.core.content.pm.PackageInfoCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

@CapacitorPlugin(name = "ReadingNative")
public class ReadingNativePlugin extends Plugin {
    private boolean awakeRequested = false;
    private boolean exportPending = false;
    private boolean updatePending = false;

    @Override
    public void load() {
        getActivity().runOnUiThread(() -> getActivity().getOnBackPressedDispatcher().addCallback(
            getActivity(), new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    bridge.triggerWindowJSEvent("reading-back");
                }
            }
        ));
    }

    @PluginMethod
    public void backgroundApp(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().moveTaskToBack(true);
            call.resolve();
        });
    }

    @PluginMethod
    public void setScreenAwake(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        getActivity().runOnUiThread(() -> {
            awakeRequested = enabled;
            applyScreenAwake(enabled);
            call.resolve();
        });
    }

    private void applyScreenAwake(boolean enabled) {
        if (enabled) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void handleOnPause() {
        applyScreenAwake(false);
    }

    @Override
    protected void handleOnResume() {
        applyScreenAwake(awakeRequested);
        bridge.triggerWindowJSEvent("reading-app-resume");
    }

    @Override
    protected void handleOnDestroy() {
        applyScreenAwake(false);
    }

    @PluginMethod
    public void exportBackup(PluginCall call) {
        if (exportPending) {
            call.reject("이미 백업 파일 저장 창이 열려 있어요.");
            return;
        }
        if (call.getString("data") == null) {
            call.reject("저장할 독서 정보가 없어요.");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("filename", "reading-calendar.json"));
        exportPending = true;
        try {
            startActivityForResult(call, intent, "backupDestination");
        } catch (Exception exception) {
            exportPending = false;
            call.reject("파일 저장 창을 열 수 없어요.", exception);
        }
    }

    @ActivityCallback
    private void backupDestination(PluginCall call, ActivityResult result) {
        exportPending = false;
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.resolve(new JSObject().put("cancelled", true));
            return;
        }
        bridge.execute(() -> {
            try (OutputStream output = getContext().getContentResolver().openOutputStream(result.getData().getData(), "wt")) {
                if (output == null) throw new IllegalStateException("Cannot open destination");
                output.write(call.getString("data", "").getBytes(StandardCharsets.UTF_8));
                call.resolve(new JSObject().put("cancelled", false));
            } catch (Exception exception) {
                call.reject("백업 파일을 저장하지 못했어요. 다른 위치에 다시 저장해 주세요.", exception);
            }
        });
    }

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            long versionCode = PackageInfoCompat.getLongVersionCode(info);
            call.resolve(new JSObject()
                .put("versionName", info.versionName != null ? info.versionName : "0.0.0")
                .put("versionCode", versionCode)
                .put("packageName", info.packageName));
        } catch (Exception exception) {
            call.reject("현재 앱 버전을 확인하지 못했어요.", exception);
        }
    }

    @PluginMethod
    public void canInstallUpdates(PluginCall call) {
        call.resolve(new JSObject().put("allowed", canRequestInstalls()));
    }

    private boolean canRequestInstalls() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        return getContext().getPackageManager().canRequestPackageInstalls();
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || canRequestInstalls()) {
            call.resolve(new JSObject().put("allowed", true));
            return;
        }
        Intent intent = new Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:" + getContext().getPackageName())
        );
        try {
            startActivityForResult(call, intent, "installPermissionResult");
        } catch (Exception exception) {
            call.reject("설치 권한 설정 화면을 열 수 없어요.", exception);
        }
    }

    @ActivityCallback
    private void installPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        call.resolve(new JSObject().put("allowed", canRequestInstalls()));
    }

    @PluginMethod
    public void fetchReleaseMetadata(PluginCall call) {
        String manifestUrl = call.getString("manifestUrl");
        String apiUrl = call.getString("apiUrl");
        if (manifestUrl == null && apiUrl == null) {
            call.reject("버전 확인 주소가 올바르지 않아요.");
            return;
        }
        bridge.execute(() -> {
            Exception lastError = null;
            if (manifestUrl != null && !manifestUrl.isEmpty()) {
                try {
                    String body = readHttpsText(manifestUrl, "application/json");
                    call.resolve(new JSObject().put("source", "manifest").put("body", body));
                    return;
                } catch (Exception exception) {
                    lastError = exception;
                }
            }
            if (apiUrl != null && !apiUrl.isEmpty()) {
                try {
                    String body = readHttpsText(apiUrl, "application/vnd.github+json");
                    call.resolve(new JSObject().put("source", "api").put("body", body));
                    return;
                } catch (Exception exception) {
                    lastError = exception;
                }
            }
            call.reject("최신 버전 정보를 가져오지 못했어요. 네트워크 연결을 확인해 주세요.", lastError);
        });
    }

    @PluginMethod
    public void installApkFromUrl(PluginCall call) {
        if (updatePending) {
            call.reject("이미 업데이트 파일을 내려받고 있어요.");
            return;
        }
        if (!canRequestInstalls()) {
            call.resolve(new JSObject().put("needsPermission", true).put("started", false));
            return;
        }
        String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {
            call.reject("올바른 업데이트 파일 주소가 아니에요.");
            return;
        }
        String expectedSha256 = call.getString("sha256");
        updatePending = true;
        bridge.execute(() -> {
            HttpURLConnection connection = null;
            File updatesDir = new File(getContext().getCacheDir(), "updates");
            if (!updatesDir.exists()) updatesDir.mkdirs();
            File[] staleFiles = updatesDir.listFiles();
            if (staleFiles != null) {
                for (File stale : staleFiles) {
                    if (stale.isFile()) stale.delete();
                }
            }
            File apkFile = new File(updatesDir, "reading-calendar-update.apk");
            try {
                connection = openHttpsFollowingRedirects(url, "application/vnd.android.package-archive");
                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) {
                    throw new IOException("HTTP " + status);
                }
                long total = connection.getContentLengthLong();
                long received = 0;
                int lastPercent = -1;
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(apkFile)) {
                    byte[] buffer = new byte[16384];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                        digest.update(buffer, 0, read);
                        received += read;
                        int percent = total > 0 ? (int) Math.min(100, Math.round((received * 100.0) / total)) : -1;
                        if (percent != lastPercent || total <= 0) {
                            lastPercent = percent;
                            JSObject progress = new JSObject()
                                .put("received", received)
                                .put("total", total)
                                .put("percent", percent);
                            bridge.triggerWindowJSEvent("reading-update-progress", progress.toString());
                        }
                    }
                    output.flush();
                }
                if (received <= 0 || !apkFile.exists()) {
                    throw new IOException("Empty update file");
                }
                if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
                    String actual = toHex(digest.digest());
                    if (!actual.equalsIgnoreCase(expectedSha256.trim())) {
                        apkFile.delete();
                        call.reject("내려받은 업데이트 파일 검증에 실패했어요. 다시 시도해 주세요.");
                        return;
                    }
                }
                Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    apkFile
                );
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().runOnUiThread(() -> {
                    try {
                        getContext().startActivity(installIntent);
                        call.resolve(new JSObject().put("started", true).put("needsPermission", false));
                    } catch (Exception exception) {
                        call.reject("설치 화면을 열지 못했어요.", exception);
                    }
                });
            } catch (Exception exception) {
                if (apkFile.exists()) apkFile.delete();
                call.reject("업데이트 파일을 내려받지 못했어요. 잠시 후 다시 시도해 주세요.", exception);
            } finally {
                if (connection != null) connection.disconnect();
                updatePending = false;
            }
        });
    }

    private String readHttpsText(String urlString, String accept) throws IOException {
        HttpURLConnection connection = null;
        try {
            connection = openHttpsFollowingRedirects(urlString, accept);
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) {
                throw new IOException("HTTP " + status);
            }
            try (InputStream input = connection.getInputStream();
                 ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int read;
                int total = 0;
                while ((read = input.read(buffer)) != -1) {
                    total += read;
                    if (total > 1024 * 1024) throw new IOException("Response too large");
                    output.write(buffer, 0, read);
                }
                return output.toString(StandardCharsets.UTF_8.name());
            }
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private HttpURLConnection openHttpsFollowingRedirects(String urlString, String accept) throws IOException {
        String current = urlString;
        for (int hop = 0; hop < 6; hop++) {
            if (current == null || !current.startsWith("https://")) {
                throw new IOException("Unsupported URL scheme");
            }
            URL url = new URL(current);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setRequestProperty("User-Agent", "reading-calendar-android");
            if (accept != null) connection.setRequestProperty("Accept", accept);
            int status = connection.getResponseCode();
            if (status == HttpURLConnection.HTTP_MOVED_PERM
                || status == HttpURLConnection.HTTP_MOVED_TEMP
                || status == HttpURLConnection.HTTP_SEE_OTHER
                || status == 307
                || status == 308) {
                String location = connection.getHeaderField("Location");
                connection.disconnect();
                if (location == null || location.isEmpty()) {
                    throw new IOException("Missing redirect location");
                }
                current = new URL(url, location).toString();
                continue;
            }
            return connection;
        }
        throw new IOException("Too many redirects");
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format(Locale.US, "%02x", b & 0xff));
        }
        return sb.toString();
    }
}
