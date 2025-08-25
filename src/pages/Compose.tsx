import React from 'react';
import PostComposer from '@/components/PostComposer';

const Compose: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Compose Post</h1>
        <p className="text-muted-foreground mt-2">
          Create and schedule content for your Facebook pages and Instagram accounts.
        </p>
      </div>
      
      <PostComposer />
    </div>
  );
};

export default Compose;