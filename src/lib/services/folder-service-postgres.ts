import { prisma } from "@/lib/prisma";

export const getFolders = async (userId: number): Promise<string[]> => {
  const folders = await prisma.folder.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { name: true }
  });

  return folders.map((folder: any) => folder.name);
};

export const addFolder = async (folderName: string, userId: number): Promise<void> => {
  try {
    await prisma.folder.create({
      data: {
        name: folderName,
        userId
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Folder already exists');
    }
    throw error;
  }
};

export const updateFolder = async (
  oldName: string,
  newName: string,
  userId: number
): Promise<void> => {
  // Update folder name
  await prisma.folder.updateMany({
    where: {
      userId,
      name: oldName
    },
    data: {
      name: newName
    }
  });

  // Update all vocabulary items in this folder
  await prisma.vocabulary.updateMany({
    where: {
      userId,
      folder: oldName
    },
    data: {
      folder: newName
    }
  });
};

export const deleteFolder = async (folderName: string, userId: number): Promise<void> => {
  // Delete all vocabulary items in this folder first
  await prisma.vocabulary.deleteMany({
    where: {
      userId,
      folder: folderName
    }
  });

  // Then delete the folder
  await prisma.folder.deleteMany({
    where: {
      userId,
      name: folderName
    }
  });
};

export const clearFolders = async (userId: number): Promise<void> => {
  await prisma.folder.deleteMany({
    where: { userId }
  });
};
