import { prisma } from "@/lib/prisma";
import type { VocabularyItem, Language } from "@/lib/types";

export const getVocabulary = async (userId: number): Promise<VocabularyItem[]> => {
  const vocabulary = await prisma.vocabulary.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  // Convert to match the existing VocabularyItem interface
  return vocabulary.map((item: any) => ({
    id: item.id.toString(),
    word: item.word,
    language: item.language as Language,
    vietnameseTranslation: item.vietnameseTranslation,
    folder: item.folder,
    partOfSpeech: item.partOfSpeech || undefined,
    ipa: item.ipa || undefined,
    pinyin: item.pinyin || undefined,
    createdAt: item.createdAt.toISOString(),
    audioSrc: item.audioSrc || undefined
  }));
};

export const addVocabularyItem = async (
  item: Omit<VocabularyItem, "id" | "createdAt">,
  userId: number
): Promise<VocabularyItem> => {
  const newItem = await prisma.vocabulary.create({
    data: {
      word: item.word,
      language: item.language,
      vietnameseTranslation: item.vietnameseTranslation,
      folder: item.folder,
      partOfSpeech: item.partOfSpeech || null,
      ipa: item.ipa || null,
      pinyin: item.pinyin || null,
      audioSrc: item.audioSrc || null,
      userId
    }
  });

  return {
    id: newItem.id.toString(),
    word: newItem.word,
    language: newItem.language as Language,
    vietnameseTranslation: newItem.vietnameseTranslation,
    folder: newItem.folder,
    partOfSpeech: newItem.partOfSpeech || undefined,
    ipa: newItem.ipa || undefined,
    pinyin: newItem.pinyin || undefined,
    createdAt: newItem.createdAt.toISOString(),
    audioSrc: newItem.audioSrc || undefined
  };
};

export const addManyVocabularyItems = async (
  items: Omit<VocabularyItem, "id" | "createdAt">[],
  userId: number
): Promise<VocabularyItem[]> => {
  const createdItems = await prisma.$transaction(
    items.map(item => 
      prisma.vocabulary.create({
        data: {
          word: item.word,
          language: item.language,
          vietnameseTranslation: item.vietnameseTranslation,
          folder: item.folder,
          partOfSpeech: item.partOfSpeech || null,
          ipa: item.ipa || null,
          pinyin: item.pinyin || null,
          audioSrc: item.audioSrc || null,
          userId
        }
      })
    )
  );

  return createdItems.map((item: any) => ({
    id: item.id.toString(),
    word: item.word,
    language: item.language as Language,
    vietnameseTranslation: item.vietnameseTranslation,
    folder: item.folder,
    partOfSpeech: item.partOfSpeech || undefined,
    ipa: item.ipa || undefined,
    pinyin: item.pinyin || undefined,
    createdAt: item.createdAt.toISOString(),
    audioSrc: item.audioSrc || undefined
  }));
};

export const updateVocabularyItem = async (
  id: string,
  updates: Partial<Omit<VocabularyItem, "id" | "createdAt">>
): Promise<void> => {
  await prisma.vocabulary.update({
    where: { id: parseInt(id) },
    data: {
      word: updates.word,
      language: updates.language,
      vietnameseTranslation: updates.vietnameseTranslation,
      folder: updates.folder,
      partOfSpeech: updates.partOfSpeech || null,
      ipa: updates.ipa || null,
      pinyin: updates.pinyin || null,
      audioSrc: updates.audioSrc || null
    }
  });
};

export const deleteVocabularyItem = async (id: string): Promise<void> => {
  await prisma.vocabulary.delete({
    where: { id: parseInt(id) }
  });
};

export const deleteVocabularyByFolder = async (
  folderName: string,
  userId: number
): Promise<void> => {
  await prisma.vocabulary.deleteMany({
    where: {
      userId,
      folder: folderName
    }
  });
};

export const updateVocabularyFolder = async (
  oldFolderName: string,
  newFolderName: string,
  userId: number
): Promise<void> => {
  await prisma.vocabulary.updateMany({
    where: {
      userId,
      folder: oldFolderName
    },
    data: {
      folder: newFolderName
    }
  });
};

export const clearVocabulary = async (userId: number): Promise<void> => {
  await prisma.vocabulary.deleteMany({
    where: { userId }
  });
};
