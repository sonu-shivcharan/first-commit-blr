import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getOwnedChatbot } from "@/lib/aws/chatbots"
import { dynamodb } from "@/lib/aws/dynamodb"
import { s3Client } from "@/lib/aws/s3"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    )
  }

  const { chatbotId } = await params
  const chatbot = await getOwnedChatbot(chatbotId, userId)
  if (!chatbot) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 })
  }

  try {
    const bucket = process.env.AWS_S3_BUCKET_NAME
    if (bucket) {
      const objects = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `chatbots/${chatbotId}/documents/`,
        })
      )
      const keys = (objects.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string => Boolean(key))

      if (keys.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
          })
        )
      }
    }

    await dynamodb.send(
      new DeleteCommand({
        TableName: "chatbots",
        Key: { id: chatbotId },
        ConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
      })
    )

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("Error deleting chatbot:", error)
    return NextResponse.json(
      { error: "Unable to delete chatbot." },
      { status: 500 }
    )
  }
}
