
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FolderInput } from 'lucide-react';

export function DirectorySelector() {
  const [directoryPath, setDirectoryPath] = useState('');
  const [recursive, setRecursive] = useState(false);
  const { toast } = useToast();

  const handleSelectDirectory = () => {
    toast({
      title: "Directory Scanning Not Available",
      description: "Direct local directory scanning from the browser is not supported for security reasons. Please use the file uploader.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="directory-path" className="block text-sm font-medium mb-1">Directory Path</Label>
        <div className="flex items-center gap-2">
         <FolderInput className="h-5 w-5 text-muted-foreground" />
        <Input
          id="directory-path"
          type="text"
          placeholder="/path/to/your/documents (disabled)"
          value={directoryPath}
          onChange={(e) => setDirectoryPath(e.target.value)}
          className="flex-grow"
          disabled={true}
        />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          This feature is currently disabled. Please use the file uploader.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="recursive-scan"
          checked={recursive}
          onCheckedChange={(checked) => setRecursive(checked as boolean)}
          disabled={true}
        />
        <Label htmlFor="recursive-scan" className="text-sm font-medium opacity-50">
          Scan subdirectories recursively
        </Label>
      </div>
      <Button onClick={handleSelectDirectory} className="w-full" disabled={true}>
        Scan Directory & Add Files (Disabled)
      </Button>
    </div>
  );
}
