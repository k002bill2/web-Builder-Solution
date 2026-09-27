// QA 전용 vitest 설정 — app 설정을 바꾸지 않고 QA 폴더의 probe만 실행한다 (QA 폴더 밖 의존 해석 불가라 import 없이 객체만).
export default {
  test: { root: new URL("../../../../app/", import.meta.url).pathname, dir: new URL("./", import.meta.url).pathname, include: ["**/l4b-probe.test.ts"], globals: true, environment: "node" },
};
