import { Tag } from 'lucide-react';

export default function CategoriesHeader() {
    return (
        <div>
            <div className="mb-1 flex items-center gap-2">
                <Tag className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Categories Catalog</h1>
            </div>
            <p className="text-sm text-muted-foreground">
                Define catalog containers for items, organize POS layouts, and handle cascade tag settings.
            </p>
        </div>
    );
}