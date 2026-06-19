import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

export function GiphyPicker({ onSelectGif }: { onSelectGif: (url: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('guko');
  const [gifs, setGifs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchGifs = async () => {
    if (!GIPHY_API_KEY) {
      setError('Giphy API key is missing. Please add it to your environment variables.');
      return;
    }
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${searchTerm}&limit=20`
      );
      if (!response.ok) {
        if (response.status === 403) {
             setError('Failed to fetch GIFs. The API key may be invalid or has exceeded its limit.');
        } else {
             throw new Error(`Giphy API request failed with status ${response.status}`);
        }
        setGifs([]);
        return;
      }
      const data = await response.json();
      setGifs(data.data);
    } catch (err: any) {
      console.error('Error fetching GIFs:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    searchGifs();
  }, []);

  if (!GIPHY_API_KEY) {
      return (
          <div className="p-4 bg-background rounded-lg shadow-lg text-center text-destructive">
              <p>Giphy integration is not configured.</p>
              <p className="text-xs text-muted-foreground">Please provide a GIPHY_API_KEY in your environment variables.</p>
          </div>
      )
  }

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
      {error && <p className="text-destructive text-sm text-center my-2">{error}</p>}
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
