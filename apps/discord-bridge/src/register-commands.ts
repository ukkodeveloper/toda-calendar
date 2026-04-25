import { REST, Routes } from "discord.js"

import { sprintCommands } from "./commands.js"
import { loadEnv } from "./env.js"

async function main() {
  const env = loadEnv()
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN)

  await rest.put(Routes.applicationGuildCommands(env.DISCORD_APPLICATION_ID, env.DISCORD_GUILD_ID), {
    body: sprintCommands.map((command) => command.toJSON()),
  })

  console.log(`Registered Discord commands for guild ${env.DISCORD_GUILD_ID}.`)
}

main().catch((error) => {
  console.error("Failed to register Discord commands.")
  console.error(error)
  process.exitCode = 1
})
