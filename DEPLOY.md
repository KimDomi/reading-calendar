# reading-calendar 배포

Cloudflare Worker 이름은 `reading-calendar`이며, 기본 `wrangler.jsonc`도 같은 이름으로 맞췄다.
GitHub 저장소는 `KimDomi/reading-calendar`로 변경됐고 배포 브랜치는 `main`이다. Cloudflare의 Git 연결 표시도 확인한다.
이전 주소는 https://fff.waffle4843.workers.dev 이다. 이름 변경 후 이 주소가 계속 동작한다고 가정하지 않는다.

## 이름 변경 마무리

앱 표시 이름은 `독서 달력`이다. 저장소·Worker 식별자는 `reading-calendar`로 유지한다.

1. GitHub 저장소 이름은 `reading-calendar`로 변경됐다. 다른 로컬 복제본도 origin을 변경한다.

   ```sh
   git remote set-url origin https://github.com/KimDomi/reading-calendar.git
   ```

2. Cloudflare의 기존 Worker를 `reading-calendar`로 이름 변경했다. 이 Worker의 빌드 설정과 Git 연결을 확인한다.
   - 빌드 명령: `node scripts-versions.mjs`
   - 배포 명령: `npm run deploy` (기존 `npx wrangler deploy`도 프로젝트에 설치된 Wrangler를 사용한다.)
   - 기존 명령에 남은 `--name fff`는 사용하지 않는다.
   - 프리뷰 빌드를 사용한다면 업로드 명령: `npx wrangler versions upload`
   - 준비해 둔 `wrangler.reading-calendar.jsonc`도 같은 이름을 사용하므로 해당 설정을 지정한 기존 명령은 그대로 사용할 수 있다.
   - workers.dev 주소를 활성화한다. 계정 하위 도메인이 그대로라면 새 주소는
     `https://reading-calendar.waffle4843.workers.dev`이다. 실제 주소는 배포 결과에서 확인한다.

3. 새 주소와 Git 자동 배포를 확인하고, 미리 저장한 백업 파일을 가져와 기록을 확인한다.

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

## npm 캐시 오류 대응

`ENOENT ... /opt/buildhome/.npm/_cacache/...` 오류가 배포 도구 실행 단계에서 발생한 적이 있다.
프로젝트에 Wrangler 버전을 고정해 배포 중 `npx`의 즉석 도구 설치를 없앴고, `.npmrc`의 캐시는 작업 디렉터리 아래 `.npm-cache`로 분리했다. 무결성 검사는 유지한다.

Cloudflare에 오래된 빌드가 대기 중이면 최신 수정 커밋을 새로 빌드한다. 오래된 커밋의 재시도는 새 설정을 포함하지 않는다.
캐시 복원 오류가 계속되면 Cloudflare의 빌드 캐시 비우기 기능으로 캐시를 초기화하고 최신 커밋을 재시도한다.
