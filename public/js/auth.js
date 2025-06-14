document.addEventListener('DOMContentLoaded', function() {
    // Elementos de la UI
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const resetTab = document.getElementById('resetTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const resetForm = document.getElementById('resetForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    const resetMessage = document.getElementById('resetMessage');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLogin = document.getElementById('backToLogin');
    
    // Variables para captcha
    let captchaAnswer = 0;
    let emailVerified = false;
    
    // Generar captcha
    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        captchaAnswer = num1 + num2;
        document.getElementById('captchaQuestion').textContent = `${num1} + ${num2} = ?`;
    }
    
    // Inicializar captcha
    generateCaptcha();
    
    // Refrescar captcha
    document.getElementById('refreshCaptcha').addEventListener('click', generateCaptcha);

    // Cambiar entre pestañas
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        resetTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        resetForm.classList.remove('active');
        clearMessages();
        // Resetear formulario de recuperación
        resetRecoveryForm();
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        resetTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        resetForm.classList.remove('active');
        clearMessages();
        // Resetear formulario de recuperación
        resetRecoveryForm();
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

    // Manejar recuperación de contraseña
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        const userCaptchaAnswer = parseInt(document.getElementById('captchaAnswer').value);
        
        // Verificar captcha
        if (userCaptchaAnswer !== captchaAnswer) {
            showMessage(resetMessage, 'Captcha incorrecto. Inténtalo de nuevo.', 'danger');
            generateCaptcha();
            document.getElementById('captchaAnswer').value = '';
            return;
        }
        
        if (!emailVerified) {
            // Verificar email
            try {
                showMessage(resetMessage, 'Verificando email...', 'info');
                
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error al verificar email');
                }
                
                showMessage(resetMessage, 'Email verificado. Ahora puedes cambiar tu contraseña.', 'success');
                emailVerified = true;
                document.getElementById('newPasswordSection').style.display = 'block';
                document.getElementById('resetBtn').innerHTML = '<i class="fas fa-save me-2"></i>Cambiar Contraseña';
                document.getElementById('resetEmail').disabled = true;
                document.getElementById('captchaAnswer').disabled = true;
                // Agregar required a los campos de contraseña cuando se muestran
                document.getElementById('newPassword').setAttribute('required', 'required');
                document.getElementById('confirmNewPassword').setAttribute('required', 'required');
                
            } catch (error) {
                showMessage(resetMessage, error.message, 'danger');
                generateCaptcha();
                document.getElementById('captchaAnswer').value = '';
            }
        } else {
            // Cambiar contraseña
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (!newPassword || !confirmNewPassword) {
                showMessage(resetMessage, 'Por favor completa todos los campos', 'danger');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                showMessage(resetMessage, 'Las contraseñas no coinciden', 'danger');
                return;
            }
            
            if (newPassword.length < 6) {
                showMessage(resetMessage, 'La contraseña debe tener al menos 6 caracteres', 'danger');
                return;
            }
            
            try {
                showMessage(resetMessage, 'Cambiando contraseña...', 'info');
                
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, newPassword })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error al cambiar contraseña');
                }
                
                showMessage(resetMessage, 'Contraseña cambiada exitosamente. Redirigiendo al login...', 'success');
                
                // Resetear formulario y volver al login
                setTimeout(() => {
                    resetForm.reset();
                    emailVerified = false;
                    document.getElementById('newPasswordSection').style.display = 'none';
                    document.getElementById('resetBtn').innerHTML = '<i class="fas fa-key me-2"></i>Verificar Email';
                    document.getElementById('resetEmail').disabled = false;
                    document.getElementById('captchaAnswer').disabled = false;
                    loginTab.click();
                }, 2000);
                
            } catch (error) {
                showMessage(resetMessage, error.message, 'danger');
            }
        }
    });

    // Cambiar a pestaña de recuperación
    resetTab.addEventListener('click', () => {
        resetTab.classList.add('active');
        loginTab.classList.remove('active');
        registerTab.classList.remove('active');
        resetForm.classList.add('active');
        loginForm.classList.remove('active');
        registerForm.classList.remove('active');
        clearMessages();
        generateCaptcha();
        // Resetear estado del formulario
        resetRecoveryForm();
    });

    // Enlace "¿Olvidaste tu contraseña?"
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetTab.click();
    });
    
    // Volver al login
    backToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginTab.click();
    });

    // Función para mostrar mensajes
    function showMessage(element, message, type) {
        element.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }

    // Función para limpiar mensajes
    function clearMessages() {
        loginMessage.innerHTML = '';
        registerMessage.innerHTML = '';
        resetMessage.innerHTML = '';
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


// Función para resetear el formulario de recuperación
function resetRecoveryForm() {
    emailVerified = false;
    document.getElementById('newPasswordSection').style.display = 'none';
    document.getElementById('resetBtn').innerHTML = '<i class="fas fa-key me-2"></i>Verificar Email';
    document.getElementById('resetEmail').disabled = false;
    document.getElementById('captchaAnswer').disabled = false;
    // Limpiar campos
    document.getElementById('resetEmail').value = '';
    document.getElementById('captchaAnswer').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    // Remover required de los campos de contraseña cuando están ocultos
    document.getElementById('newPassword').removeAttribute('required');
    document.getElementById('confirmNewPassword').removeAttribute('required');
}