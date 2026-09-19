import {
  CreateDataSourceCommand,
  CreateKnowledgeBaseCommand,
  GetKnowledgeBaseCommand,
  BedrockAgentClient,
} from "@aws-sdk/client-bedrock-agent"

export const bedrockAgent = new BedrockAgentClient({
  region: process.env.AWS_REGION,
})

const embeddingModelArn =
  process.env.BEDROCK_EMBEDDING_MODEL_ARN ??
  `arn:aws:bedrock:${process.env.AWS_REGION}::foundation-model/amazon.titan-embed-text-v2:0`

export async function createKnowledgeBase({
  chatbotId,
  description,
}: {
  chatbotId: string
  description: string
}) {
  const roleArn = requireEnvironment("BEDROCK_KNOWLEDGE_BASE_ROLE_ARN")
  const vectorBucketArn = requireEnvironment("S3_VECTORS_BUCKET_ARN")
  const vectorIndexArn = requireEnvironment("S3_VECTORS_INDEX_ARN")
  const bucketName = requireEnvironment("AWS_S3_BUCKET_NAME")
  const bucketArn = `arn:aws:s3:::${bucketName}`

  const knowledgeBase = await bedrockAgent.send(
    new CreateKnowledgeBaseCommand({
      clientToken: chatbotId,
      name: `kb-${chatbotId}`,
      description,
      roleArn,
      knowledgeBaseConfiguration: {
        type: "VECTOR",
        vectorKnowledgeBaseConfiguration: { embeddingModelArn },
      },
      storageConfiguration: {
        type: "S3_VECTORS",
        s3VectorsConfiguration: {
          vectorBucketArn,
          indexArn: vectorIndexArn,
        },
      },
    })
  )

  const knowledgeBaseId = knowledgeBase.knowledgeBase?.knowledgeBaseId
  if (!knowledgeBaseId) {
    throw new Error("Bedrock did not return a knowledge base ID.")
  }

  return { knowledgeBaseId }
}

export async function createDataSource({
  chatbotId,
  knowledgeBaseId,
  name,
}: {
  chatbotId: string
  knowledgeBaseId: string
  name: string
}) {
  const bucketName = requireEnvironment("AWS_S3_BUCKET_NAME")
  const dataSource = await bedrockAgent.send(
    new CreateDataSourceCommand({
      clientToken: chatbotId,
      knowledgeBaseId,
      name: `documents-${chatbotId}`,
      description: `Documents uploaded for ${name}.`,
      dataSourceConfiguration: {
        type: "S3",
        s3Configuration: {
          bucketArn: `arn:aws:s3:::${bucketName}`,
          inclusionPrefixes: [`chatbots/${chatbotId}/documents/`],
        },
      },
    })
  )

  const dataSourceId = dataSource.dataSource?.dataSourceId
  if (!dataSourceId) {
    throw new Error("Bedrock did not return a data source ID.")
  }

  return { dataSourceId }
}

export async function getKnowledgeBaseStatus(knowledgeBaseId: string) {
  const result = await bedrockAgent.send(
    new GetKnowledgeBaseCommand({ knowledgeBaseId })
  )
  return result.knowledgeBase?.status ?? "UNKNOWN"
}

function requireEnvironment(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured.`)
  }
  return value
}
