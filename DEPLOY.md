# reading-calendar 배포

현재 자동 배포는 GitHub `KimDomi/fff`의 `main`과 Cloudflare Worker `fff`에 연결되어 있다.
기존 주소는 https://fff.waffle4843.workers.dev 이다.
`wrangler.jsonc`는 이 기존 사이트를 유지하기 위한 설정이다.

## 이름 변경 마무리

앱 표시 이름은 `reading-calendar`로 변경했다. 외부 서비스의 이름과 연결은 계정 관리 권한으로 변경해야 한다.

1. GitHub https://github.com/KimDomi/fff/settings 의 Repository name을 `reading-calendar`로 변경한다.
   GitHub는 이전 저장소 URL을 새 URL로 연결하지만, 로컬 origin도 변경한다.

   ```sh
   git remote set-url origin https://github.com/KimDomi/reading-calendar.git
   ```

2. Cloudflare Workers & Pages에서 새 Worker `reading-calendar`를 만들고 변경한 저장소의 `main`을 연결한다.
   - 빌드 명령: `node scripts-versions.mjs`
   - 배포 명령: `npx wrangler deploy --config wrangler.reading-calendar.jsonc`
   - 기존 명령에 남은 `--name fff`는 사용하지 않는다.
   - 프리뷰 빌드를 사용한다면 업로드 명령: `npx wrangler versions upload --config wrangler.reading-calendar.jsonc`
   - workers.dev 주소를 활성화한다. 계정 하위 도메인이 그대로라면 새 주소는
     `https://reading-calendar.waffle4843.workers.dev`이다. 실제 주소는 배포 결과에서 확인한다.

3. 새 주소와 Git 자동 배포를 확인한 후 기본 `wrangler.jsonc`의 이름도 `reading-calendar`로 맞출 수 있다.
   기존 Worker `fff`는 기록 이전을 마칠 때까지 유지한다.

이 저장소의 설정 파일만으로 GitHub 저장소 이름이나 Cloudflare 대시보드의 연결이 변경되지는 않는다.

## 기록 이전

브라우저 저장소는 주소마다 별개다. 새 주소를 열어도 이전 기록은 자동으로 이동하지 않는다.

1. 기존 주소에서 설정 → 독서 정보 관리 → 내보내기로 JSON 파일을 저장한다.
2. 새 주소에서 같은 메뉴의 가져오기로 파일을 불러온다. 설정도 가져오기를 선택하면 화면 모드·알림 설정·쉬는 날이 함께 복원된다.
3. 책·독서 기록·설정을 확인한다. 진행 중인 타이머는 백업 대상이 아니므로 이전되지 않는다.

이전 중에는 기존 주소를 새 주소로 리다이렉트하지 않는다. 기존 주소의 백업 화면을 계속 사용할 수 있어야 한다.

## 배포 전 확인

`node scripts-versions.mjs`로 캐시 버전을 갱신하고 `npm run check`로 기존 기능과 백업 호환성을 검증한다.
배포 후 설정 탭, 화면 모드 전환, 새 독서 계획의 색상 선택을 확인한다.
