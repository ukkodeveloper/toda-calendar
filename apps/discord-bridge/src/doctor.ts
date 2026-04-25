import { REST, Routes } from "discord.js"

import { loadEnv } from "./env.js"

async function main() {
  const env = loadEnv()
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN)

  const application = (await rest.get(Routes.currentApplication())) as { id: string; name: string }
  const guild = (await rest.get(Routes.guild(env.DISCORD_GUILD_ID))) as { id: string; name: string }
  const channel = (await rest.get(Routes.channel(env.DISCORD_SPRINT_CHANNEL_ID))) as {
    id: string
    name?: string
    type: number
  }

  console.log("## discord bridge doctor")
  console.log(`repo_root=${env.repoRoot}`)
  console.log(`application=${application.name} (${application.id})`)
  console.log(`guild=${guild.name} (${guild.id})`)
  console.log(`sprint_channel=${channel.name ?? "unknown"} (${channel.id})`)
  console.log(`channel_type=${channel.type}`)
  console.log(`state_file=${env.stateFile}`)
  console.log(`worktree_root=${env.worktreeRoot}`)
}

main().catch((error) => {
  console.error("Discord doctor failed.")
  console.error(error)
  process.exitCode = 1
})
