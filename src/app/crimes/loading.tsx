/** Placeholder cards with the same layout as the list, shown while it loads. */
export default function CrimesLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto p-8 flex-grow">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Reported Crimes</h1>
          <p className="text-muted-foreground mt-2">
            Browse and view details of reported incidents.
          </p>
        </header>
        <div className="my-10 border-t-2 border-[#3b5998]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 my-10">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-full min-h-[220px] flex flex-col border border-[#3b5998] shadow-lg rounded-xl bg-[#f5f8fa] p-6 animate-pulse"
            >
              <div className="h-6 bg-blue-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-blue-50 rounded w-1/3 mb-4" />
              <div className="h-4 bg-blue-50 rounded w-full mb-2" />
              <div className="h-4 bg-blue-50 rounded w-5/6 mb-2" />
              <div className="h-4 bg-blue-50 rounded w-1/2 mb-4" />
              <div className="h-8 bg-blue-100 rounded w-full mt-auto" />
            </div>
          ))}
        </div>
        <div className="my-10 border-t-2 border-[#3b5998]" />
      </div>
    </div>
  );
}
