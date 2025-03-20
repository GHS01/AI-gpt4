// Funciones de autenticación con Supabase para el frontend

// URL base para las APIs
const baseUrl = window.location.origin;

/**
 * Registra un nuevo usuario en Supabase
 * @param {string} username - Nombre de usuario
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 * @param {string} role - Rol (user/admin)
 * @param {object} teamData - Datos del equipo (opcional)
 */
async function registerUserWithSupabase(username, email, password, role = 'user', teamData = null) {
  try {
    console.log('Registrando usuario con Supabase');
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: username,
        email,
        password,
        role,
        team_code: teamData?.code
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Error al registrar usuario');
    }

    const data = await response.json();
    console.log('Usuario registrado exitosamente:', data);
    
    showNotification('Éxito', 'Usuario registrado correctamente', 'success');
    
    // Redireccionar al login después del registro
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    
    return data.user;
  } catch (error) {
    console.error('Error en registro:', error);
    showNotification('Error', error.message || 'Error al registrar usuario', 'error');
    throw error;
  }
}

/**
 * Inicia sesión con Supabase
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña
 */
async function loginWithSupabase(email, password) {
  try {
    console.log('Iniciando sesión con Supabase');
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Error al iniciar sesión');
    }

    const data = await response.json();
    console.log('Sesión iniciada exitosamente');
    
    // Guardar información de sesión
    sessionStorage.setItem('userId', data.user.auth_user_id);
    sessionStorage.setItem('userName', data.user.name);
    sessionStorage.setItem('userRole', data.user.role);
    sessionStorage.setItem('token', data.token);
    
    if (data.user.team_code) {
      sessionStorage.setItem('teamCode', data.user.team_code);
    }
    
    showNotification('Éxito', '¡Sesión iniciada correctamente!', 'success');
    
    // Mostrar la interfaz principal
    document.getElementById('loginSection').style.display = 'none';
    document.querySelector('.navbar').style.display = 'flex';
    document.getElementById('content').style.display = 'block';
    document.querySelector('.whatsapp-bubble').style.display = 'flex';
    
    // Actualizar la interfaz con los datos del usuario
    document.getElementById('profileUsername').textContent = data.user.name;
    
    console.log('Migración de usuarios completada');
    showNotification('Información', 'Migración de usuarios completada', 'info');

    return data.user;
  } catch (error) {
    console.error('Error en login:', error);
    showNotification('Error', error.message || 'Error al iniciar sesión', 'error');
    throw error;
  }
}

/**
 * Crea un nuevo equipo
 * @param {string} name - Nombre del equipo
 * @param {string} password - Contraseña del equipo (opcional)
 */
async function createTeam(name, password = '') {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) throw new Error('No hay sesión activa');
    
    console.log('Creando equipo:', name);
    const response = await fetch(`${baseUrl}/api/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Error al crear equipo');
    }

    const data = await response.json();
    showNotification('Éxito', `Equipo "${name}" creado correctamente`, 'success');
    return data.team;
  } catch (error) {
    console.error('Error al crear equipo:', error);
    showNotification('Error', error.message || 'Error al crear equipo', 'error');
    throw error;
  }
}

/**
 * Genera un código de equipo basado en el nombre
 * @param {string} teamName - Nombre del equipo
 * @returns {string} Código generado
 */
function generateTeamCode(teamName) {
  if (!teamName) return '';
  
  // Tomar los primeros 4 caracteres del nombre del equipo en mayúsculas
  const prefix = teamName.substring(0, 4).toUpperCase();
  
  // Generar un número aleatorio de 4 dígitos
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  // Formato: XXXX-0000
  return `${prefix}-${randomNum}`;
}

// Evento DOMContentLoaded para reemplazar los manejadores de eventos existentes
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando manejadores de eventos con Supabase');
  
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  // Capturar eventos de los formularios
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await loginWithSupabase(email, password);
      } catch (error) {
        console.error('Error en login:', error);
      }
    });
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      try {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const profileType = document.getElementById('profileType').value;
        
        let teamData = null;
        
        // Si es administrador, crear equipo
        if (profileType === 'admin') {
          const accessCode = document.getElementById('accessCode').value;
          
          // Usar el código global definido en el script de index.html
          if (typeof ADMIN_ACCESS_CODE === 'undefined') {
            console.error('Error: ADMIN_ACCESS_CODE no está definido');
            showNotification('Error', 'Error de configuración - Comuníquese con el administrador', 'error');
            return;
          }
          
          if (accessCode !== ADMIN_ACCESS_CODE) {
            showNotification('Error', 'Código de acceso incorrecto', 'error');
            return;
          }
          
          const teamName = document.getElementById('createTeamName').value;
          const teamPassword = document.getElementById('createTeamPassword').value;
          
          teamData = {
            name: teamName,
            code: generateTeamCode(teamName),
            password: teamPassword
          };
        } else {
          // Si es usuario normal, unirse a equipo
          const teamCode = document.getElementById('joinTeamCode').value;
          const teamPassword = document.getElementById('joinTeamPassword').value;
          
          if (!teamCode) {
            showNotification('Error', 'Debe ingresar un código de equipo', 'error');
            return;
          }
          
          teamData = {
            code: teamCode
          };
        }
        
        await registerUserWithSupabase(username, email, password, profileType, teamData);
      } catch (error) {
        console.error('Error en registro:', error);
      }
    });
  }
}); 