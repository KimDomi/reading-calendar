package com.kimdomi.readingcalendar;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import android.content.Context;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class LaunchTest {
    @Test
    public void packagedAppHasLocalEntryAndNativePlugin() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("com.kimdomi.readingcalendar", context.getPackageName());
        try (var input = context.getAssets().open("public/index.html")) {
            assertNotNull(input);
        }
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            CountDownLatch checked = new CountDownLatch(1);
            scenario.onActivity(activity -> {
                assertEquals("https://localhost", activity.getBridge().getAppUrl());
                assertNotNull(activity.getBridge().getPlugin("ReadingNative"));
                checked.countDown();
            });
            assertEquals(true, checked.await(10, TimeUnit.SECONDS));
        }
    }
}
