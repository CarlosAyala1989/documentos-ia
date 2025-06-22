document.addEventListener('DOMContentLoaded', function() {
    const slug = window.location.pathname.split('/').pop();
    cargarContenidoCompartido(slug);
});

async function cargarContenidoCompartido(slug) {
    try {
        const response = await fetch(`/api/compartir/${slug}`);
        const data = await response.json();

        if (data.success) {
            mostrarContenido(data);
        } else {
            mostrarError(data.error || 'Contenido no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar contenido:', error);
        mostrarError('Error al cargar el contenido compartido');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function mostrarContenido(data) {
    const { contenido, mensajes } = data;
    
    // Mostrar información del contenido
    document.getElementById('titulo-contenido').textContent = contenido.titulo;
    document.getElementById('descripcion-contenido').textContent = contenido.descripcion || 'Sin descripción';
    document.getElementById('autor-contenido').textContent = `${contenido.usuario.nombre} ${contenido.usuario.apellidos}`;
    document.getElementById('fecha-contenido').textContent = new Date(contenido.compartido_en).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('vistas-contenido').textContent = contenido.vistas;
    document.getElementById('tipo-contenido').textContent = contenido.tipo_contenido === 'conversacion' ? 'Conversación' : 'Consulta';

    if (contenido.tipo_contenido === 'conversacion') {
        mostrarConversacionCompleta(contenido.conversacion, mensajes);
    } else {
        mostrarConsultaIndividual(contenido.mensaje);
    }

    document.getElementById('contenido').style.display = 'block';
}

function mostrarConversacionCompleta(conversacion, mensajes) {
    document.getElementById('conversacion-completa').style.display = 'block';
    
    const container = document.getElementById('mensajes-conversacion');
    container.innerHTML = '';

    if (!mensajes || mensajes.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Esta conversación no tiene mensajes.
            </div>
        `;
        return;
    }

    mensajes.forEach((mensaje, index) => {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mb-4 p-3 rounded ${mensaje.tipo_mensaje === 'consulta' ? 'mensaje-consulta' : 'mensaje-respuesta'}`;
        
        const fechaMensaje = new Date(mensaje.creado_en).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const tipoIcon = mensaje.tipo_mensaje === 'consulta' ? 'fa-user' : 'fa-robot';
        const tipoColor = mensaje.tipo_mensaje === 'consulta' ? 'primary' : 'success';

        mensajeDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0 text-${tipoColor}">
                    <i class="fas ${tipoIcon} me-2"></i>
                    ${mensaje.tipo_mensaje === 'consulta' ? 'Consulta' : 'Respuesta'} #${index + 1}
                </h6>
                <small class="text-muted">${fechaMensaje}</small>
            </div>
            <div class="mensaje-contenido" style="white-space: pre-wrap; line-height: 1.6;">
                ${mensaje.contenido_mensaje}
            </div>
        `;
        
        container.appendChild(mensajeDiv);
    });
}

function mostrarConsultaIndividual(mensaje) {
    document.getElementById('consulta-individual').style.display = 'block';
    
    const container = document.getElementById('mensaje-individual');
    
    const fechaMensaje = new Date(mensaje.creado_en).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const tipoIcon = mensaje.tipo_mensaje === 'consulta' ? 'fa-user' : 'fa-robot';
    const tipoColor = mensaje.tipo_mensaje === 'consulta' ? 'primary' : 'success';

    container.innerHTML = `
        <div class="p-4 rounded ${mensaje.tipo_mensaje === 'consulta' ? 'mensaje-consulta' : 'mensaje-respuesta'}">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0 text-${tipoColor}">
                    <i class="fas ${tipoIcon} me-2"></i>
                    ${mensaje.tipo_mensaje === 'consulta' ? 'Consulta' : 'Respuesta'}
                </h5>
                <small class="text-muted">${fechaMensaje}</small>
            </div>
            <div class="mensaje-contenido" style="white-space: pre-wrap; line-height: 1.6; font-size: 1.1em;">
                ${mensaje.contenido_mensaje}
            </div>
        </div>
    `;
}

function mostrarError(mensaje) {
    document.getElementById('error-message').textContent = mensaje;
    document.getElementById('error').style.display = 'block';
}