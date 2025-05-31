const { createClient } = require('@supabase/supabase-js');

// Variables de entorno para Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno SUPABASE_URL y SUPABASE_KEY son requeridas');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Definida' : 'No definida');
  console.error('SUPABASE_KEY:', supabaseKey ? 'Definida' : 'No definida');
  process.exit(1);
}

// Crear cliente de Supabase sin autenticación automática
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Verificar conexión básica
async function verificarConexion() {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Error al conectar con Supabase:', error.message);
    } else {
      console.log('✅ Conexión con Supabase establecida correctamente');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

verificarConexion();

module.exports = supabase;