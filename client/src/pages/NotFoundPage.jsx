import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="container-main py-12 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-sm text-slate-600">The page you requested does not exist.</p>
      <Link to="/" className="mt-4 inline-block rounded bg-fkBlue px-4 py-2 text-sm font-semibold text-white">
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
