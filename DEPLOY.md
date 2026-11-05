# Cloudflare Pages 배포

1. Cloudflare 대시보드의 Workers & Pages에서 Pages 프로젝트를 만든다.
2. Git 저장소 연결을 선택하고 GitHub의 `KimDomi/fff`를 연결한다.
3. 프로덕션 브랜치를 `main`으로 선택한다.
4. 프레임워크는 `None`, 빌드 명령은 `node scripts-versions.mjs`, 출력 폴더는 `dist`로 설정한다.
5. 배포 후 제공되는 `pages.dev` 주소를 연다.

환경 변수나 API 키는 필요하지 않다. 이후 main 브랜치 업데이트가 자동 배포된다.

## 기록 이전

기존 사이트의 독서 정보 내보내기로 JSON 파일을 저장한다.
새 사이트에서 설정 → 독서 정보 관리 → 가져오기를 사용한다.
브라우저 저장소는 사이트 주소별로 분리되므로 자동 이전되지 않는다.

## 배포 전 확인

`npm run check`로 기존 기능과 색상 프리셋 테스트를 실행한다.
배포 후 설정 탭, 화면 모드 전환, 새 독서 계획의 색상 선택을 확인한다.
