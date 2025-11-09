export default function Forbidden() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white text-center">
        <h1 className="text-5xl font-bold mb-4 text-pink-500">403</h1>
        <p className="text-xl mb-6">No tienes permisos para acceder a esta página.</p>
        <a
          href="/"
          className="bg-pink-600 hover:bg-pink-500 transition px-6 py-3 rounded-xl font-semibold"
        >
          Volver al inicio
        </a>
      </div>
    );
  }
  