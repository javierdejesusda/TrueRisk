# RETO: GESTIÓN DE EMERGENCIAS CLIMÁTICAS
## Aplicación web para la gestión de emergencias climáticas

### Contexto
En los últimos años, hemos aprendido que la diferencia entre un susto y una tragedia durante un fenómeno meteorológico extremo suele estar en la **información**. Sin embargo, recibir un aviso que dice "Alerta Roja por lluvias" no significa lo mismo para todos: no es el mismo riesgo para quien vive en un cuarto piso que para quien vive en un bajo, ni para alguien con plena movilidad que para una persona mayor que vive sola.

El objetivo de este reto es construir una herramienta de **soporte a la ciudadanía ante emergencias climáticas**. Queremos dejar de dar avisos genéricos para empezar a dar instrucciones que salvan vidas.

Vuestra misión es diseñar una aplicación web que recupere la previsión meteorológica de un proveedor externo y la analice junto con los datos proporcionados por el ciudadano para que, en caso de situación climática extrema, le pueda explicar qué debe hacer en su caso particular para poner su vida a salvo.

Se trata de un importante proyecto con un gran impacto directo en la sociedad: **poner la tecnología más avanzada al servicio de la protección, el cuidado y el bienestar de los más vulnerables.**

---

### Funcionalidades

#### 1. Registro y gestión de perfil de usuario
* Los usuarios deben registrarse para poder utilizar la aplicación.
* En el formulario de registro, se debe incluir obligatoriamente los siguientes campos:
    * Provincia
    * Tipo de vivienda (Sótano, Planta baja, Piso alto, Casa de campo)
    * Necesidades especiales (Silla de ruedas, persona dependiente, mascotas)
    * Todos aquellos campos que a vuestro criterio sean necesarios para completar la funcionalidad
* Deben existir dos tipos de usuario:
    * Ciudadano (Rol usuario)
    * Backoffice (Rol administrador)

#### 2. Vista de Ciudadano
* Se debe poder visualizar la previsión meteorológica obtenida mediante la consulta a una API externa proporcionada por nosotros.
* En base a la previsión meteorológica, debe ofrecer recomendaciones de seguridad personalizadas según la ubicación, tipo de vivienda y necesidades especiales almacenadas en el perfil. *[Ver funcionalidad 4]*
* Si existe una alerta activa, esta debe aparecer de manera visible en la aplicación y debe ofrecer recomendaciones personalizadas según el perfil del usuario. *[Ver funcionalidad 4]*
* Se debe llevar un registro de los datos meteorológicos obtenidos pudiendo ser visualizados en un listado. Así mismo se llevará un registro histórico de consultas realizadas al LLM y alertas recibidas, siendo igualmente consultables a través de un listado.

#### 3. Vista de Backoffice
* Se debe poder visualizar la previsión meteorológica obtenida mediante la consulta a una API externa proporcionada por nosotros.
* En base a la previsión meteorológica recibida, el sistema debe indicar si es recomendable emitir una alerta general o no. *[Ver funcionalidad 4]*
* Se debe llevar un registro de los datos meteorológicos obtenidos pudiendo ser visualizados en un listado. Así mismo se llevará un registro histórico de consultas realizadas al LLM y alertas recibidas, siendo igualmente consultables a través de un listado.
* Crear un botón para crear y emitir alertas a todos los ciudadanos registrados en la aplicación.

#### 4. Integración LLM: Tu primer paso en la Inteligencia Artificial: El Prompt Engineering
Para poder lograr el nivel de personalización que exigen las funcionalidades marcadas dentro de los puntos 2 y 3 no necesitáis ser expertos en matemáticas ni programar redes neuronales complejas. Vais a utilizar una herramienta de Inteligencia Artificial llamada LLM (un modelo de lenguaje similar a ChatGPT) a través de una API que nosotros os proporcionamos.

Vuestro trabajo principal con la IA es el Prompt Engineering.

**¿Qué es el Prompt Engineering?** Es el arte de saber "pedirle" cosas a la IA. Consiste en redactar instrucciones (prompts) tan claras y detalladas que la máquina sea capaz de razonar por nosotros.

Por ejemplo: En lugar de solo enviarle los datos de lluvia, vuestra labor será decirle a la IA: "Actúa como un experto en emergencias. Si ves que el usuario vive en un sótano y la lluvia supera los 100mm, dile con calma pero firmeza que debe subir a un piso superior".

Vuestra habilidad para diseñar estos "manuales de instrucciones" para la IA será la que determine si la aplicación da un consejo útil o uno genérico. Es vuestra oportunidad de ver cómo la IA puede ayudar en el desarrollo de sistemas complejos.

**¿Cómo lo haréis?** Nosotros os proporcionaremos una API para interactuar con el LLM que tendrá dos parámetros de entrada:
* **system_prompt:** En este parámetro debéis enviar las instrucciones iniciales que definirán el comportamiento del modelo. Su función es indicarle al modelo cómo debe comportarse, qué rol debe asumir y qué tipo de respuesta debe dar (reglas, estilo, tono, límites, etc.). Por ejemplo: *"Eres un entrenador personal que diseña rutinas de ejercicio seguras para principiantes."*
* **user_prompt:** En este parámetro debéis enviar la consulta concreta que queráis hacerle al LLM. Siguiendo el ejemplo anterior, el user prompt podría ser: *"¿Qué rutina de ejercicios puedo hacer en casa si solo tengo 20 minutos al día?"*

---

### Requisitos técnicos
* **Frontend:** diseño *responsive* y usable con las tecnologías que os sintáis más cómodos (por ejemplo React, Vue, Angular...)
* **Backend:** desarrollado con la tecnología que queráis: Node.js, Spring Boot, Laravel, etc.
    > **NOTA:** No es obligatorio separar el frontend y el backend, se puede utilizar un framework full-stack que integre ambos en una misma arquitectura, como por ejemplo Django, Next.js, Nuxt.js, etc. Queda a libre elección del desarrollador.
* **Persistencia:** almacenamiento en base de datos
* **Documentación:** instrucciones claras de ejecución del proyecto, y también de despliegue en caso de que se haya llegado a esta última fase.

### Aspectos OPTATIVOS valorados
* **Autenticación con protocolo OAuth2** y servidor de autorización (Ejemplo: Keycloak).
* **Alertas en tiempo real** sin que el usuario tenga que refrescar la página.

### Criterios de evaluación
* **Número de funcionalidades completas y estables**
* **Calidad del código:** buenas prácticas, estructura mantenible, claridad
* **Diseño de la web:** accesibilidad, estética, usabilidad
* **Enfoque sostenible:** cómo la app contribuye a mejorar la gestión ecológica en el campus
* **Bonus:** despliegue en un entorno cloud, panel de métricas o logs, CI/CD, *testing*

### Material complementario
**Todo lo necesario para comenzar la práctica lo tienes disponible en este repositorio:**
https://github.com/Next-Digital-Hub/hackaton-upm-2026

---

### Entrega del Reto

**Para entregar tu solución, sigue estos pasos:**

1. Tal y como se indica en el *README* del repositorio, haz un *fork* en tu cuenta de GitHub.
2. Desarrolla tu solución en ese *fork*.
3. Antes de que finalice la hora de la entrega, asegúrate de que el repositorio es público.
4. Una vez finalizado el desarrollo, crea una *Pull Request* hacia la rama "*main*" del repositorio original.

**Importante: mantén tu repositorio privado durante el desarrollo** para evitar que otras personas puedan copiar tu trabajo. Hazlo público sólo cuando vayas a crear la *Pull Request* una vez finalizado el desarrollo.