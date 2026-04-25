import { SlashCommandBuilder } from "discord.js"

export const sprintCommands = [
  new SlashCommandBuilder()
    .setName("sprint")
    .setDescription("기능용 toda 스프린트 스레드를 시작해요")
    .addStringOption((option) =>
      option.setName("feature").setDescription("oauth 같은 기능 슬러그").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("sprint").setDescription("sprint1 같은 스프린트 ID").setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("현재 스레드 상태나 채널 전체 스프린트 요약을 보여줘요"),
]
