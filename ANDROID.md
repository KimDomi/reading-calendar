# reading-calendar Android 0.1.1

1차는 Android 7.0 이상에서 설치하는 테스트용 APK다. 스토어 등록용 릴리스는 아직 아니다.
웹과 Android 앱은 같은 `dist` 코어를 사용하며, APK에는 실행 파일을 포함한다.
Cloudflare 사이트를 띄우는 원격 웹뷰가 아니므로 설치 후 인터넷 없이도 독서 계획·달력·완독 기록·타이머·설정을 사용할 수 있다.

## 설치와 기록 이전

1. `artifacts/reading-calendar-0.1.1-debug.apk`를 휴대폰에서 열고 설치한다. 기존 0.1.0 앱은 삭제하지 않고 업데이트한다. 요청될 때 해당 다운로드 앱의 설치 허용을 켠다.
2. 앱의 설정 → 독서 정보 관리 → 가져오기에서 웹에서 저장한 JSON 백업을 선택한다.
3. 책·기록·화면 모드·쉬는 날이 맞는지 확인한다. 앱과 웹의 기록은 자동 동기화되지 않는다.

앱을 지우거나 앱 데이터를 초기화하면 로컬 기록이 삭제된다. 설정 → 독서 정보 관리 → 내보내기로 안드로이드 파일 저장 창에서 JSON을 보관할 수 있다.
앱은 파일 전체 접근·알림 권한을 요청하지 않는다. 파일 선택은 Android 시스템 선택기를 사용한다.

## 1차 구현

- 기존 웹 코어를 앱에 포함한 오프라인 실행과 기기 로컬 저장.
- 시스템 파일 선택기를 통한 기존 JSON 백업 가져오기와 내보내기. 저장 취소는 성공으로 표시하지 않는다.
- 안드로이드 뒤로 가기: 시간·날짜 선택창 → 팝업 → 달력으로 이동 → 앱을 백그라운드로 이동.
- 타이머 화면에서 실행 중 화면 켜짐 유지. 일시정지·다른 탭·백그라운드에서는 해제한다.
- 다크·라이트 모드에 맞춘 시스템 표시줄 아이콘, 앱 아이콘과 시작 화면.
- 앱 복귀 시 오늘 날짜와 확인하지 않은 진도 재확인.

독서 알림의 켜기·끄기와 시간은 저장하지만, 실제 알림 발송은 후속 단계다.
타이머 종료 소리·백그라운드 종료 알림도 이번 범위에 포함하지 않는다.

## 개발 환경

- Node.js 22 이상, Java **JDK** 21 (JRE만으로는 컴파일할 수 없음).
- Android SDK Platform 36, Build Tools 35.0.0, `ANDROID_HOME` 설정.
- 첫 빌드는 Gradle과 Android 의존성 다운로드를 위해 네트워크가 필요하다.

```sh
npm ci
npm run check
npm run android:debug
```

Windows에서는 `npm run android:sync` 후 Android Studio로 `android` 폴더를 열거나 `android/gradlew.bat assembleDebug`를 사용한다.
생성된 APK는 `android/app/build/outputs/apk/debug/app-debug.apk`에 있으며, `node scripts-android-artifact.mjs`로 `artifacts`에 복사하고 SHA-256 파일을 만들 수 있다.
앱 ID `com.kimdomi.readingcalendar`와 WebView의 `https://localhost` 원본을 유지해야 기존 앱 저장소를 이어 쓸 수 있다.

## 검증과 다음 단계

0.1.1은 초기 본문이 비어 있던 문제를 수정한다. 번들 없는 Android 주입 브리지는 `Capacitor.Plugins`를 제공하며 JS 코어의 `registerPlugin`을 제공하지 않는다. 이 실제 형태로 전체 모듈 시작 테스트를 실행해 재발을 방지한다.

`npm run check`는 웹 일정·백업 회귀 검사와 네이티브 연결의 웹 폴백·파일 저장 취소·화면 잠금 해제·뒤로 가기·복귀·테마 검사를 실행한다.
`cd android && ./gradlew connectedDebugAndroidTest`는 연결된 Android 기기/에뮬레이터에서 앱 ID·로컬 엔트리·플러그인 등록을 확인한다.
실제 기기에서는 첫 실행, 백업 왕복, 비행기 모드 실행, 뒤로 가기, 키보드와 표시줄 겹침, 화면 켜짐 유지와 백그라운드 복귀를 확인해야 한다.

다음은 기기 검증 후 로컬 독서 알림, 정식 서명·배포와 업데이트 경로다.
다음 APK를 덮어 설치하려면 같은 서명 키와 더 높은 versionCode를 사용한다. 테스트용 debug 키는 저장소에 넣지 않는다.
작업 환경이 바뀌어 서명이 달라진 경우 설치된 앱을 삭제하기 전에 반드시 독서 정보를 내보낸다.
