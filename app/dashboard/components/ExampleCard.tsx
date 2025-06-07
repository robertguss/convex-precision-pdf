import React from 'react';

interface ExampleCardProps {
  title: string;
  tags?: string[];
  imageUrl: string;
  onClick?: () => void;
}

function ExampleCard({ title, tags, imageUrl, onClick }: ExampleCardProps) {
  return (
    <div
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg bg-gray-50 shadow-md transition-shadow duration-200 ease-in-out hover:shadow-lg"
    >
      <div className="h-40 w-full overflow-hidden border-b border-gray-200 bg-gray-200">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-grow flex-col justify-between p-4">
        <div>
          <h3 className="text-md mb-1 font-semibold text-gray-700 transition-colors group-hover:text-blue-600">
            {title}
          </h3>
          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExampleCard;
