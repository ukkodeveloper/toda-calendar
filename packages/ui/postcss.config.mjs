/*
 * S1.5: postcss 설정은 @workspace/tailwind-config 로 이전했다.
 * 여기선 그걸 재-export 해 @workspace/ui/postcss.config 진입점을 유지한다(중복 제거).
 */
export { default } from "@workspace/tailwind-config/postcss.config";
