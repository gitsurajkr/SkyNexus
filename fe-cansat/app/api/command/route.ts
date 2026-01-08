import { writeFileSync } from 'fs'
import path from 'path'

export async function POST(req: Request) {
  const { cmd } = await req.json()

  if (cmd !== 'C' && cmd !== 'D') {
    return new Response('Invalid command', { status: 400 })
  }

  // Resolve command.txt at project root
  const cmdPath = path.join(process.cwd(), 'command.txt')

  writeFileSync(cmdPath, cmd, { encoding: 'utf-8' })

  return new Response('OK')
}
