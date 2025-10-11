// 🔥 Firebase Version (Old)
import { useAuth } from "@/contexts/auth-context";
import { getVocabulary, addVocabularyItem } from "@/lib/services/vocabulary-service";

export function VocabularyComponent() {
  const { user } = useAuth(); // user has uid (string)
  
  const loadVocabulary = async () => {
    if (user?.uid) {
      const vocab = await getVocabulary(user.uid); // string parameter
      setVocabulary(vocab);
    }
  };
  
  const addWord = async (word: VocabularyItem) => {
    if (user?.uid) {
      await addVocabularyItem(word, user.uid); // string parameter
    }
  };
}

// ⚡ PostgreSQL Version (New)
import { useAuth } from "@/contexts/auth-context-postgres";
import { getVocabulary, addVocabularyItem } from "@/lib/services/vocabulary-service-postgres";

export function VocabularyComponent() {
  const { user } = useAuth(); // user has id (number)
  
  const loadVocabulary = async () => {
    if (user?.id) {
      const vocab = await getVocabulary(user.id); // number parameter
      setVocabulary(vocab);
    }
  };
  
  const addWord = async (word: VocabularyItem) => {
    if (user?.id) {
      await addVocabularyItem(word, user.id); // number parameter
    }
  };
}
