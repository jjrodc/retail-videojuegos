const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, default: 'cliente' } // puedes cambiar los roles según necesidad
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
