document.addEventListener('DOMContentLoaded', () => {
    // Elementos de la UI
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');

    // Cambiar entre pestañas
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        clearMessages();
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        clearMessages();
    });

    // Manejar inicio de sesión
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            showMessage(loginMessage, 'Iniciando sesión...', 'info');
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }
            
            showMessage(loginMessage, 'Inicio de sesión exitoso. Redirigiendo...', 'success');
            
            // Redireccionar a la página principal después de un breve retraso
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
            
        } catch (error) {
            showMessage(loginMessage, error.message, 'danger');
        }
    });

    // Manejar registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            showMessage(registerMessage, 'Las contraseñas no coinciden', 'danger');
            return;
        }
        
        try {
            showMessage(registerMessage, 'Creando cuenta...', 'info');
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al registrar usuario');
            }
            
            showMessage(registerMessage, data.message, 'success');
            
            // Limpiar el formulario
            registerForm.reset();
            
            // Cambiar a la pestaña de inicio de sesión después de un breve retraso
            setTimeout(() => {
                loginTab.click();
            }, 3000);
            
        } catch (error) {
            showMessage(registerMessage, error.message, 'danger');
        }
    });

    // Función para mostrar mensajes
    function showMessage(element, message, type) {
        element.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }

    // Función para limpiar mensajes
    function clearMessages() {
        loginMessage.innerHTML = '';
        registerMessage.innerHTML = '';
    }

    // Verificar si el usuario ya está autenticado
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/user');
            
            if (response.ok) {
                // Si el usuario ya está autenticado, redirigir a la página principal
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error al verificar estado de autenticación:', error);
        }
    }

    // Verificar estado de autenticación al cargar la página
    checkAuthStatus();
});