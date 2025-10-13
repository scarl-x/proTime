import React from 'react';

export interface UiPreferencesValue {
  hideExtended: boolean;
  setHideExtended: (value: boolean) => void;
}

export const UiPreferencesContext = React.createContext<UiPreferencesValue>({
  hideExtended: false,
  setHideExtended: () => {},
});


