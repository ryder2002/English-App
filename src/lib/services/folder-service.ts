import { prisma } from "@/lib/prisma";
import type { Folder } from "@/lib/types";

export const getFolders = async (userId: number): Promise<Folder[]> => {
  const folders = await prisma.folder.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });

  return folders.map((folder: any) => ({
    id: folder.id.toString(),
    name: folder.name,
    userId: folder.userId,
    parentId: folder.parentId ? folder.parentId.toString() : null,
    createdAt: folder.createdAt.toISOString()
  }));
};

export const addFolder = async (
  folderName: string, 
  userId: number, 
  parentId?: number | null
): Promise<Folder> => {
  try {
    const newFolder = await prisma.folder.create({
      data: {
        name: folderName,
        userId,
        parentId: parentId || null
      }
    });

    return {
      id: newFolder.id.toString(),
      name: newFolder.name,
      userId: newFolder.userId,
      parentId: newFolder.parentId ? newFolder.parentId.toString() : null,
      createdAt: newFolder.createdAt.toISOString()
    };
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
  // First, find all subfolders recursively
  const findAllSubfolders = async (parentName: string): Promise<string[]> => {
    const folder = await prisma.folder.findFirst({
      where: { name: parentName, userId },
      include: { children: true }
    });

    if (!folder) return [parentName];

    const subfolderNames = [parentName];
    for (const child of folder.children) {
      const childSubfolders = await findAllSubfolders(child.name);
      subfolderNames.push(...childSubfolders);
    }

    return subfolderNames;
  };

  const allFolderNames = await findAllSubfolders(folderName);

  // Delete all vocabulary items in these folders
  await prisma.vocabulary.deleteMany({
    where: {
      userId,
      folder: { in: allFolderNames }
    }
  });

  // Delete all folders (children will be deleted due to CASCADE)
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
