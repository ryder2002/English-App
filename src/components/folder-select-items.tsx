"use client";

import { SelectItem } from "@/components/ui/select";
import type { Folder } from "@/lib/types";

interface FolderSelectItemsProps {
  folders: Folder[];
  folderTree: Folder[];
  valueKey?: 'id' | 'name';
  renderPrefix?: (level: number) => React.ReactNode;
  showAllOption?: boolean;
  allOptionLabel?: string;
  includeEmpty?: boolean;
  showNewFolderOption?: boolean;
  newFolderLabel?: string;
}

/**
 * Helper function to flatten folder tree with hierarchy information
 * Returns folders with full path display names
 */
function flattenFolderTree(
  tree: Folder[], 
  level: number = 0, 
  parentPath: string[] = []
): Array<Folder & { displayName: string; fullPath: string; level: number }> {
  const result: Array<Folder & { displayName: string; fullPath: string; level: number }> = [];
  
  tree.forEach((folder) => {
    const currentPath = [...parentPath, folder.name];
    const fullPath = currentPath.join(" > ");
    const indent = "  ".repeat(level);
    const displayPrefix = level > 0 ? "└─ " : "";
    const displayName = indent + displayPrefix + folder.name;
    
    result.push({ ...folder, displayName, fullPath, level });
    
    if (folder.children && folder.children.length > 0) {
      result.push(...flattenFolderTree(folder.children, level + 1, currentPath));
    }
  });
  
  return result;
}

export function FolderSelectItems({ 
  folders, 
  folderTree, 
  valueKey = 'id',
  showAllOption = false,
  allOptionLabel = "Tất cả thư mục",
  includeEmpty = true,
  showNewFolderOption = false,
  newFolderLabel = "+ Tạo thư mục mới..."
}: FolderSelectItemsProps) {
  if (!folders || folders.length === 0) {
    return includeEmpty ? (
      <>
        <SelectItem value="none" disabled>Không có thư mục nào</SelectItem>
        {showNewFolderOption && (
          <SelectItem value="new_folder">{newFolderLabel}</SelectItem>
        )}
      </>
    ) : null;
  }

  const flattened = flattenFolderTree(folderTree);
  
  return (
    <>
      {showAllOption && (
        <SelectItem value={valueKey === 'id' ? 'all' : 'all'}>{allOptionLabel}</SelectItem>
      )}
      {flattened.map((folder) => {
        const value = valueKey === 'id' ? String(folder.id) : folder.name;
        // Use fullPath as title for tooltip, displayName for visual hierarchy
        return (
          <SelectItem key={folder.id} value={value} title={folder.fullPath}>
            <span className="whitespace-pre font-mono text-sm">{folder.displayName}</span>
            {folder.level > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">({folder.fullPath})</span>
            )}
          </SelectItem>
        );
      })}
      {showNewFolderOption && (
        <SelectItem value="new_folder">{newFolderLabel}</SelectItem>
      )}
    </>
  );
}

