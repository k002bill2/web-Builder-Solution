# Pretendard — 출처·체크섬 (M2B-4a · SPEC-MOTION-FONT 2.1·2.6 · MQ-M2B3-4 ★A)

사이트(렌더 문서·정적 HTML·PNG)는 이 폴더의 `Pretendard-Regular.subset.woff2`(400)·`Pretendard-Bold.subset.woff2`(700)를 **무수정**(Original Version)으로 쓴다 — 이름 `Pretendard` 유지. 라이선스 원문은 저장소 루트 `LICENSES.md`.

| 항목 | 값 |
|---|---|
| 원본 URL | https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip (태그 v1.3.9 → 커밋 5c41199ea0024a9e0b2cb31735265056e5472d76) |
| 원본 zip sha256 | 04be351a74d6bf7d60c480a3087e51d185485d35a52023142af1df19eb8c428a |
| zip 안 경로 | `web/static/woff2-subset/Pretendard-{Regular,Bold}.subset.woff2` |
| 대조 결과 | 저장소 파일 = zip 안 파일 바이트 동일 (2026-10-05 M2B-4a E0 R-5) |
| Pretendard-Regular.subset.woff2 sha256 | 01dd73155fdfab7ce9b25224523e85a96927e21aef97f21957d41f1bfa7e3878 (267,096 B) |
| Pretendard-Bold.subset.woff2 sha256 | 78eb71c33101ee7d4f8d1b777d193a12d00f8a296e712a8c417cf27abe946397 (270,784 B) |
| 수정 | 없음 |

재현: `curl -sSL -o /tmp/p.zip <원본 URL> && unzip -o /tmp/p.zip 'web/static/woff2-subset/*' -d /tmp/p && shasum -a 256 /tmp/p/web/static/woff2-subset/Pretendard-{Regular,Bold}.subset.woff2 app/src/assets/fonts/Pretendard-{Regular,Bold}.subset.woff2`
