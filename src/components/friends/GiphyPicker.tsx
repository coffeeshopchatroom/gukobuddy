
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';

const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; // Public Beta Key

export function GiphyPicker({ onSelectGif }: { onSelectGif: (url: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('guko');
  const [gifs, setGifs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchGifs = async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${searchTerm}&limit=20`
      );
      const data = await response.json();
      setGifs(data.data);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    searchGifs();
  }, []);

  return (
    <div className="p-4 bg-background rounded-lg shadow-lg">
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search for GIFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchGifs()}
        />
        <Button onClick={searchGifs} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2 h-64 overflow-y-auto">
        {gifs.map((gif) => (
          <div
            key={gif.id}
            className="cursor-pointer"
            onClick={() => onSelectGif(gif.images.fixed_height.url)}
          >
            <img src={gif.images.fixed_height.url} alt={gif.title} className="w-full h-full object-cover rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
