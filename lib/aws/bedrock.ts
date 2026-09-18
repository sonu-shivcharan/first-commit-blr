import { BedrockAgentClient } from "@aws-sdk/client-bedrock-agent"

export const bedrockAgent = new BedrockAgentClient({
  region: process.env.AWS_REGION,
})
