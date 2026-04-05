export const buyToken = async () => {
  const res = await fetch("http://localhost:3000/buy");
  const data = await res.text();
  return data;
};