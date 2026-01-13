import { createContext, useContext, useState, ReactNode } from "react";

interface BackgroundMusicContextType {
  audioUrl: string | null;
  isPlayerVisible: boolean;
  setAudioUrl: (url: string | null) => void;
  showPlayer: () => void;
  hidePlayer: () => void;
}

const BackgroundMusicContext = createContext<
  BackgroundMusicContextType | undefined
>(undefined);

export const useBackgroundMusic = () => {
  const context = useContext(BackgroundMusicContext);
  if (!context) {
    throw new Error(
      "useBackgroundMusic must be used within BackgroundMusicProvider"
    );
  }
  return context;
};

interface BackgroundMusicProviderProps {
  children: ReactNode;
}

export const BackgroundMusicProvider = ({
  children,
}: BackgroundMusicProviderProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  const showPlayer = () => setIsPlayerVisible(true);
  const hidePlayer = () => {
    setIsPlayerVisible(false);
    setAudioUrl(null);
  };

  return (
    <BackgroundMusicContext.Provider
      value={{
        audioUrl,
        isPlayerVisible,
        setAudioUrl,
        showPlayer,
        hidePlayer,
      }}
    >
      {children}
    </BackgroundMusicContext.Provider>
  );
};
