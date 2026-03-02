import jwt from 'jsonwebtoken';

const isAdmin = (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token não fornecido.' });
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token inválido.' });
    if (!decoded.isAdmin) return res.status(403).json({ message: 'Acesso negado. Somente administradores.' });
    req.user = decoded;
    next();
  });
};

export default isAdmin;
