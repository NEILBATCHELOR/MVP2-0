import { Dispatch, SetStateAction } from "react";

/**
 * Type-safe state updater that merges partial updates
 * @param setState React setState function
 * @param updates Partial update object
 */
export function updateState<T extends Record<string, any>>(
  setState: Dispatch<SetStateAction<T>>, 
  updates: Partial<T>
) {
  setState(current => ({...current, ...updates}));
}

/**
 * Type-safe state updater for items in an array
 * @param setState React setState function for array
 * @param itemId ID of the item to update
 * @param updates Partial update object
 * @param idField Field name for the ID (default: 'id')
 */
export function updateArrayItem<T extends Record<string, any>>(
  setState: Dispatch<SetStateAction<T[]>>,
  itemId: string | number,
  updates: Partial<T>,
  idField: keyof T = 'id' as keyof T
) {
  setState(current => 
    current.map(item => 
      item[idField] === itemId ? {...item, ...updates} : item
    )
  );
} 