export const useNavigate = () => {
  const navigate = (path: string) => {
    window.location.hash = `#/${path}`;
  };

  return navigate;
};
