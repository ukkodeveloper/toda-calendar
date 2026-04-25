# OAuth Core Flow

`DESIGN_PACK` 단계에서 데모 리뷰 전에 확인할 핵심 흐름만 남긴다.

## Screen Set

- `HomeGuest`
- `BackupPromptSheet`
- `FirstBackupConfirm`
- `ServerRestoreChoice`
- `SettingsMenu`
- `SignOutConfirm`

## Mermaid

```mermaid
flowchart TD
    A[HomeGuest\n비로그인 홈] -->|첫 일정 1개 작성 직후| B[BackupPromptSheet\n백업 유도 시트]
    A -->|우측 상단 톱니바퀴| F[SettingsMenu\n설정 페이지]
    F -->|백업 또는 로그인 선택| B
    F -->|로그아웃 탭| G[SignOutConfirm\n로그아웃 확인 팝업]
    G -->|취소| F
    G -->|로그아웃\n현재 기기만 해제| A
    B -->|나중에| A
    B -->|Google 또는 Apple 로그인 성공\n서버 데이터 없음| C[FirstBackupConfirm\n첫 백업 확인]
    B -->|Google 또는 Apple 로그인 성공\n서버 데이터 있음| D[ServerRestoreChoice\n기존 계정 복구 선택]
    C -->|백업 완료| E[LoggedInCalendar\n로그인된 캘린더]
    D -->|서버 데이터로 복구| E
    D -->|취소| A
```

## Demo Focus

- 첫 진입은 비로그인 허용인지
- 로그인 유도가 가치 중심 문구로 보이는지
- 첫 백업 경로가 단순한지
- 기존 서버 데이터가 있을 때 서버 우선 원칙이 명확한지
- 설정 진입과 현재 기기 로그아웃 흐름이 자연스러운지
