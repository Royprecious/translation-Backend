import { BlobServiceClient } from "@azure/storage-blob";
import db from "../configs/firebase";
// import { CronJob } from "cron";




const AZURE_STORAGE_CONNECTION_STRING = process.env.CONTAINER || "";
const CONTAINER_NAME = process.env.CONTAINER || "";


export async function generateRandomId() {

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;

}
export async function verifyDate(date: Date): Promise<number> {
  const currentDate = new Date();
  if (date < currentDate) {
    return 0;
  }
  return 1;
}


export async function uploadFileData(file: any): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);


  const exists = await containerClient.exists();
  if (!exists) {
    throw new Error(`Container ${CONTAINER_NAME} does not exist.`);
  }

  if (file.mimetype.startsWith("video")) {

    const blobName = `video-${Date.now()}-${1}.mp4`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.uploadData(file?.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype || 'video/mp4',
          blobContentDisposition: 'inline',
        },
      });
    } catch (error) {
      throw new Error("Error uploading video file");
    }


    return blockBlobClient.url;
  }


  const blobName = `image-${Date.now()}-${1}.jpeg`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    await blockBlobClient.uploadData(file?.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype || 'image/jpeg',
        blobContentDisposition: 'inline',
      },
    });
  } catch (error) {
    throw new Error("Error uploading video file");
  }

  return blockBlobClient.url
}



export async function removeAllImages(): Promise<string> {

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const exists = await containerClient.exists();
  if (!exists) {
    throw new Error(`Container ${CONTAINER_NAME} does not exist.`);
  }


  for await (const blob of containerClient.listBlobsFlat()) {
    const blobClient = containerClient.getBlobClient(blob.name);
    try {
      await blobClient.delete();
    } catch (error) {
      throw new Error('Failed to delete all images from azure container');
    }
  }
  const message = 'Images Deleted Sucessfully';
  return message;
}


export async function deleteFileUrl(url: string): Promise<void> {
  try {

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    const blobName = url.split('/').pop()!;
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blobClient = containerClient.getBlobClient(blobName);

    await blobClient.delete();
    console.log(`Successfully deleted blob: ${blobName}`);
  } catch (error) {
    console.error('Error deleting media from Azure:', error);
    throw new Error('Failed to delete media from Azure');
  }

}



export async function publishDraft() {
  const now = new Date();

  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  try {

    const snapshot = await db
      .collection('Punica-Release')
      .where('status', '==', 'draft')
      .where('releaseDate', '>=', startOfDay)
      .where('releaseDate', '<=', endOfDay)
      .get();

    if (snapshot.empty) {
      return;
    }

    const batch = db.batch();
    snapshot.forEach((doc) => {
      const docRef = db.collection('Punica-Release').doc(doc.id);

      batch.update(docRef, { status: 'published' });
    });

    await batch.commit();
  } catch (error) {
    throw new Error('Error publishing drafts:');
  }
};


// const backgroundJob = new CronJob('0 * * * * *', async () => {
//   try {
//     await publishDraft();
//   } catch (error) {
//     throw new Error("Error during cron job execution");
//   }
// });

// backgroundJob.start();
