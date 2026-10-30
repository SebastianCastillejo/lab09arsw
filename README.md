### Escuela Colombiana de Ingeniería
### Arquitecturas de Software - ARSW

## Escalamiento en Azure con Maquinas Virtuales, Sacale Sets y Service Plans

### Dependencias
* Cree una cuenta gratuita dentro de Azure. Para hacerlo puede guiarse de esta [documentación](https://azure.microsoft.com/es-es/free/students/). Al hacerlo usted contará con $100 USD para gastar durante 12 meses.

### Parte 0 - Entendiendo el escenario de calidad

Adjunto a este laboratorio usted podrá encontrar una aplicación totalmente desarrollada que tiene como objetivo calcular el enésimo valor de la secuencia de Fibonnaci.

**Escalabilidad**
Cuando un conjunto de usuarios consulta un enésimo número (superior a 1000000) de la secuencia de Fibonacci de forma concurrente y el sistema se encuentra bajo condiciones normales de operación, todas las peticiones deben ser respondidas y el consumo de CPU del sistema no puede superar el 70%.

### Parte 1 - Escalabilidad vertical

1. Diríjase a el [Portal de Azure](https://portal.azure.com/) y a continuación cree una maquina virtual con las características básicas descritas en la imágen 1 y que corresponden a las siguientes:
    * Resource Group = SCALABILITY_LAB
    * Virtual machine name = VERTICAL-SCALABILITY
    * Image = Ubuntu Server 
    * Size = Standard B1ls
    * Username = scalability_lab
    * SSH publi key = Su llave ssh publica

![Imágen 1](images/part1/part1-vm-basic-config.png)

2. Para conectarse a la VM use el siguiente comando, donde las `x` las debe remplazar por la IP de su propia VM (Revise la sección "Connect" de la virtual machine creada para tener una guía más detallada).

    `ssh scalability_lab@xxx.xxx.xxx.xxx`

3. Instale node, para ello siga la sección *Installing Node.js and npm using NVM* que encontrará en este [enlace](https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/).
4. Para instalar la aplicación adjunta al Laboratorio, suba la carpeta `FibonacciApp` a un repositorio al cual tenga acceso y ejecute estos comandos dentro de la VM:

    `git clone <your_repo>`

    `cd <your_repo>/FibonacciApp`

    `npm install`

5. Para ejecutar la aplicación puede usar el comando `npm FibinacciApp.js`, sin embargo una vez pierda la conexión ssh la aplicación dejará de funcionar. Para evitar ese compartamiento usaremos *forever*. Ejecute los siguientes comando dentro de la VM.

    ` node FibonacciApp.js`

6. Antes de verificar si el endpoint funciona, en Azure vaya a la sección de *Networking* y cree una *Inbound port rule* tal como se muestra en la imágen. Para verificar que la aplicación funciona, use un browser y user el endpoint `http://xxx.xxx.xxx.xxx:3000/fibonacci/6`. La respuesta debe ser `The answer is 8`.

![](images/part1/part1-vm-3000InboudRule.png)

7. La función que calcula en enésimo número de la secuencia de Fibonacci está muy mal construido y consume bastante CPU para obtener la respuesta. Usando la consola del Browser documente los tiempos de respuesta para dicho endpoint usando los siguintes valores:
    * 1000000
    * 1010000
    * 1020000
    * 1030000
    * 1040000
    * 1050000
    * 1060000
    * 1070000
    * 1080000
    * 1090000    

8. Dírijase ahora a Azure y verifique el consumo de CPU para la VM. (Los resultados pueden tardar 5 minutos en aparecer).

![Imágen 2](images/part1/part1-vm-cpu.png)

9. Ahora usaremos Postman para simular una carga concurrente a nuestro sistema. Siga estos pasos.
    * Instale newman con el comando `npm install newman -g`. Para conocer más de Newman consulte el siguiente [enlace](https://learning.getpostman.com/docs/postman/collection-runs/command-line-integration-with-newman/).
    * Diríjase hasta la ruta `FibonacciApp/postman` en una maquina diferente a la VM.
    * Para el archivo `[ARSW_LOAD-BALANCING_AZURE].postman_environment.json` cambie el valor del parámetro `VM1` para que coincida con la IP de su VM.
    * Ejecute el siguiente comando.

    ```
    newman run ARSW_LOAD-BALANCING_AZURE.postman_collection.json -e [ARSW_LOAD-BALANCING_AZURE].postman_environment.json -n 10 &
    newman run ARSW_LOAD-BALANCING_AZURE.postman_collection.json -e [ARSW_LOAD-BALANCING_AZURE].postman_environment.json -n 10
    ```

10. La cantidad de CPU consumida es bastante grande y un conjunto considerable de peticiones concurrentes pueden hacer fallar nuestro servicio. Para solucionarlo usaremos una estrategia de Escalamiento Vertical. En Azure diríjase a la sección *size* y a continuación seleccione el tamaño `B2ms`.

![Imágen 3](images/part1/part1-vm-resize.png)

11. Una vez el cambio se vea reflejado, repita el paso 7, 8 y 9.
12. Evalue el escenario de calidad asociado al requerimiento no funcional de escalabilidad y concluya si usando este modelo de escalabilidad logramos cumplirlo.
13. Vuelva a dejar la VM en el tamaño inicial para evitar cobros adicionales.

**Preguntas**

1. ¿Cuántos y cuáles recursos crea Azure junto con la VM?
2. ¿Brevemente describa para qué sirve cada recurso?
3. ¿Al cerrar la conexión ssh con la VM, por qué se cae la aplicación que ejecutamos con el comando `npm FibonacciApp.js`? ¿Por qué debemos crear un *Inbound port rule* antes de acceder al servicio?
4. Adjunte tabla de tiempos e interprete por qué la función tarda tando tiempo.
5. Adjunte imágen del consumo de CPU de la VM e interprete por qué la función consume esa cantidad de CPU.
6. Adjunte la imagen del resumen de la ejecución de Postman. Interprete:
    * Tiempos de ejecución de cada petición.
    * Si hubo fallos documentelos y explique.
7. ¿Cuál es la diferencia entre los tamaños `B2ms` y `B1ls` (no solo busque especificaciones de infraestructura)?
8. ¿Aumentar el tamaño de la VM es una buena solución en este escenario?, ¿Qué pasa con la FibonacciApp cuando cambiamos el tamaño de la VM?
9. ¿Qué pasa con la infraestructura cuando cambia el tamaño de la VM? ¿Qué efectos negativos implica?
10. ¿Hubo mejora en el consumo de CPU o en los tiempos de respuesta? Si/No ¿Por qué?
11. Aumente la cantidad de ejecuciones paralelas del comando de postman a `4`. ¿El comportamiento del sistema es porcentualmente mejor?

---

## Respuestas Parte 1

### Pregunta 1 y 2 – Recursos creados con la VM

Azure crea automáticamente **5 recursos adicionales** junto con la VM:

![Recursos creados junto con la VM](images/part1/part1-resources.png)

| Nombre en Azure | Tipo | Para qué sirve |
|---|---|---|
| VERTICAL-SCALABILITY | Virtual machine | La máquina virtual en sí; ejecuta el sistema operativo y la aplicación |
| vertical-scalability989_z1 | Network interface (NIC) | Conecta la VM a la red virtual y le asigna la dirección IP privada |
| VERTICAL-SCALABILITY-ip | Public IP address | IP pública que permite acceder a la VM desde internet |
| VERTICAL-SCALABILITY-nsg | Network security group | Firewall que controla el tráfico entrante y saliente mediante reglas de puerto |
| VERTICAL-SCALABILITY-vnet | Virtual network | Red privada dentro de Azure donde se conectan todos los recursos |
| (disco OS) | Managed disk | Disco de almacenamiento persistente con el sistema operativo de la VM |

### Pregunta 3 – Por qué se cae la app al cerrar SSH

Al ejecutar `node FibonacciApp.js` en la terminal SSH, el proceso pertenece a esa sesión de shell. Cuando se cierra la conexión SSH, el sistema operativo envía la señal `SIGHUP` a todos los procesos hijos de esa sesión, lo que termina el proceso Node.js. Para que la aplicación sobreviva se debe usar `forever`, `pm2`, `nohup` o un servicio systemd que desacople el proceso de la sesión SSH.

El *Inbound port rule* es necesario porque el NSG bloquea todo el tráfico entrante por defecto. Sin la regla que abre el puerto 3000, el firewall descarta los paquetes antes de que lleguen a la aplicación, aunque esta esté corriendo correctamente dentro de la VM.

### Pregunta 4 – Tabla de tiempos (tamaño inicial)

Tiempos de respuesta medidos con la consola del navegador (DevTools → Red):

| n-ésimo Fibonacci | Tiempo de respuesta |
|---|---|
| 1.000.000 | ~6.3 s |
| 1.010.000 | ~6.3 s |
| 1.020.000 | ~6.3 s |
| 1.030.000 | ~6.4 s |
| 1.040.000 | ~6.4 s |
| 1.050.000 | ~6.4 s |
| 1.060.000 | ~6.4 s |
| 1.070.000 | ~6.4 s |
| 1.080.000 | ~6.5 s |
| 1.090.000 | ~6.5 s |

**Capturas de browser (tamaño inicial):**

![fibonacci/1010000](images/part1/part1-browser-1010000.png)
![fibonacci/1020000](images/part1/part1-browser-1020000.png)
![fibonacci/1030000](images/part1/part1-browser-1030000.png)
![fibonacci/1040000](images/part1/part1-browser-1040000.png)
![fibonacci/1050000](images/part1/part1-browser-1050000.png)
![fibonacci/1070000](images/part1/part1-browser-1070000.png)
![fibonacci/1080000](images/part1/part1-browser-1080000.png)
![fibonacci/1090000](images/part1/part1-browser-1090000.png)

**Interpretación:** La función calcula Fibonacci mediante recursión o iteración sin memoización, lo que la obliga a recorrer la secuencia completa en cada petición. Para n = 1.000.000 realiza ~1 millón de operaciones aritméticas con números de precisión arbitraria (`big-integer`), lo que es intensivo en CPU y explica los ~6 segundos por petición.

### Pregunta 5 – Consumo de CPU (tamaño inicial)

![CPU consumo tamaño inicial](images/part1/part1-cpu-initial.png)

**Interpretación:** El consumo de CPU ronda el 2.32% en reposo porque la plataforma de métricas reporta el promedio del período completo. Durante la ejecución de las peticiones la CPU alcanza el 100% momentáneamente (el algoritmo es puramente computacional, sin I/O que libere el hilo). Con el tamaño inicial (D2as_v4, 2 vCPUs) una sola petición puede saturar un núcleo por completo, impidiendo que otras peticiones concurrentes sean atendidas con normalidad.

### Pregunta 6 – Resumen de ejecución Postman/Newman (tamaño inicial)

![Newman resultados tamaño inicial](images/part1/part1-newman-initial.png)

**Interpretación:**
- **Tiempos de ejecución:** Todas las peticiones tardaron entre 6.3 s y 6.5 s (promedio 6.3 s, s.d. 72 ms). La variación mínima indica que el algoritmo es determinista y la carga de red es despreciable comparada con el tiempo de cómputo.
- **Fallos:** 0 de 10 peticiones fallaron. La VM procesó las 10 iteraciones secuenciales sin errores, aunque el tiempo total fue de 1 minuto 4.6 segundos, lo que demuestra que el sistema no puede atender concurrencia real sin degradar el servicio.

### Pregunta 7 – Diferencia entre B2ms y B1ls

| Característica | B1ls | B2ms |
|---|---|---|
| vCPUs | 1 | 2 |
| RAM | 0.5 GB | 8 GB |
| Almacenamiento temporal | 4 GB | 16 GB |
| Créditos CPU/hora | 6 | 24 |
| Costo aprox. | ~$3.80/mes | ~$60/mes |
| Modelo de bursting | Burstable (acumula créditos en reposo, los consume en picos) | Burstable con mayor baseline |

La diferencia más relevante no es solo de specs: la **B1ls está diseñada para cargas mínimas** (CI/CD agents, proxies ligeros), mientras que la **B2ms** puede sostener picos de CPU por más tiempo gracias a sus 24 créditos/hora y tiene suficiente RAM para cargas de trabajo reales. Con la FibonacciApp, la B1ls agotaría sus créditos de CPU rápidamente bajo carga concurrente y el rendimiento caería al baseline (10% de 1 vCPU).

### Pregunta 8 – ¿Es buena solución escalar verticalmente?

No es la solución óptima para este escenario. Aumentar el tamaño de la VM mejora el throughput para una sola petición pesada, pero el algoritmo sin memoización seguirá consumiendo 100% de un núcleo por petición. Con 4 vCPUs podemos atender 4 peticiones simultáneas, pero el costo de la VM se dispara. Además, **al cambiar el tamaño la VM se reinicia**, por lo que la FibonacciApp deja de estar disponible durante el proceso de redimensionamiento (downtime).

### Pregunta 9 – Efectos del cambio de tamaño

Al redimensionar la VM, Azure **detiene y reinicia** la máquina virtual. Efectos negativos:
- **Downtime:** El servicio queda inaccesible durante el reinicio (~1-3 minutos).
- **Pérdida del estado en memoria:** Cualquier caché o sesión en memoria se pierde.
- **IP dinámica:** Si la IP pública no es estática, puede cambiar.
- **Costo inmediato:** El cambio a un tamaño mayor incrementa la factura a partir del momento del cambio, aunque la carga sea baja.

### Paso 7 repetido – Tiempos de respuesta con D4as_v4

Tiempos medidos con DevTools después del escalamiento vertical a Standard_D4as_v4 (4 vCPUs):

| n-ésimo Fibonacci | Tiempo aprox. |
|---|---|
| 1.000.000 | ~6 s |
| 1.010.000 | ~10 s |
| 1.020.000 | ~27 s |
| 1.030.000 | ~6 s |
| 1.040.000 | ~10 s |
| 1.050.000 | ~45 s |
| 1.060.000 | ~6 s |
| 1.070.000 | ~27 s |
| 1.080.000 | ~30 s |
| 1.090.000 | ~11 s |

> Los tiempos más largos se explican porque el timeline de DevTools acumula todas las peticiones de la sesión de navegación. Cuando varias pestañas se abren casi simultáneamente, las peticiones se encolan en el servidor Node.js (single-threaded) y cada una espera a que termine la anterior.

![fibonacci/1000000 - D4as_v4](images/part1/part1-scaled-browser-1000000.png)
![fibonacci/1010000 - D4as_v4](images/part1/part1-scaled-browser-1010000.png)
![fibonacci/1020000 - D4as_v4](images/part1/part1-scaled-browser-1020000.png)
![fibonacci/1040000 - D4as_v4](images/part1/part1-scaled-browser-1040000.png)
![fibonacci/1050000 - D4as_v4](images/part1/part1-scaled-browser-1050000.png)
![fibonacci/1070000 - D4as_v4](images/part1/part1-scaled-browser-1070000.png)
![fibonacci/1080000 - D4as_v4](images/part1/part1-scaled-browser-1080000.png)
![fibonacci/1090000 - D4as_v4](images/part1/part1-scaled-browser-1090000.png)

### Paso 8 repetido – CPU con D4as_v4

![CPU D4as_v4 después de Newman](images/part1/part1-cpu-scaled-after-newman.png)

El gráfico muestra los pequeños picos de CPU alrededor de las 7–9 PM, que corresponden a los tests del browser y Newman. El promedio reportado es 1.9 %.

**Interpretación:** La métrica de Azure promedia el uso de CPU sobre todos los vCPUs disponibles en intervalos de 5 minutos. Con D4as_v4 (4 vCPUs), aunque Node.js satura un núcleo al 100% durante cada cálculo (~6 s), eso equivale solo al 25 % del total de 4 núcleos. Repartido en un intervalo de 5 minutos (donde el test duró ~1 minuto), el promedio se diluye a ~1.9 %. El comportamiento real del núcleo activo es idéntico al del tamaño inicial, confirmando que la CPU adicional no se aprovecha.

### Paso 9 repetido – Newman con D4as_v4

![Newman 4 instancias paralelas](images/part1/part1-newman-4parallel.png)

**Resultados:**
- Iteraciones: 10 — Fallos: 0
- Duración total: **1m 4.7s**
- Tiempo promedio de respuesta: **6.3s** [min: 6.3s, max: 6.5s, s.d.: 60ms]

**Comparación inicial vs escalado:**

| Métrica | Tamaño inicial | D4as_v4 (escalado) |
|---|---|---|
| Duración total | 1m 4.6s | 1m 4.7s |
| Tiempo promedio | 6.3s | 6.3s |
| Mínimo | 6.3s | 6.3s |
| Máximo | 6.5s | 6.5s |
| Desviación estándar | 72ms | 60ms |
| Fallos | 0/10 | 0/10 |

### Pregunta 10 – ¿Hubo mejora en el consumo de CPU o en los tiempos de respuesta?

**No.** Los resultados de Newman son prácticamente idénticos: mismo tiempo promedio (6.3s), misma duración total (~1m 4.7s) y cero fallos en ambos casos. Aumentar de 2 a 4 vCPUs no mejoró el rendimiento porque:

1. **Node.js es single-threaded**: el event loop procesa una sola solicitud CPU-intensiva a la vez. Las peticiones adicionales se encolan y esperan.
2. **El algoritmo no usa paralelismo**: calcula la secuencia de Fibonacci de forma secuencial sin aprovechar los núcleos extra.
3. **El cuello de botella es el algoritmo, no la CPU**: la solución correcta sería implementar memoización (caché de resultados) o usar `worker_threads` para distribuir el cómputo entre núcleos.

### Pregunta 11 – 4 instancias paralelas de newman

![Newman 4 instancias paralelas](images/part1/part1-newman-4parallel.png)

**Resultados de las 4 instancias paralelas (D4as_v4):**

| Instancia | Duración | Tiempo promedio | Fallos |
|---|---|---|---|
| Foreground | 3m 7.9s | 19.7s [min 6.3s, max 33.1s] | 1/10 |
| Background 1 | 2m 51.2s | 17s [min 10.7s, max 27.6s] | 1/10 |
| Background 2 | 2m 45.6s | 16.4s [min 10.6s, max 33.3s] | 0/10 |
| Background 3 | 3m 19.6s | 22.9s [min 6.3s, max 38.9s] | 2/10 |
| **Total** | **~3m 20s** | **~19s promedio** | **4/40 (10%)** |

Los errores `ECONNRESET` ocurrieron cuando el servidor tardó demasiado y el cliente cortó la conexión antes de recibir respuesta.

**Comparativa 1 instancia vs 4 instancias paralelas:**

| Métrica | 1 instancia (paso 9) | 4 instancias (paso 11) |
|---|---|---|
| Tiempo promedio | 6.3s | ~19s (+200%) |
| Duración total | 1m 4.7s | ~3m 20s |
| Fallos | 0/10 | 4/40 (10%) |
| Desviación estándar | 60ms | ~7-13s |

**¿El comportamiento es porcentualmente mejor? No, es significativamente peor.** El tiempo promedio se triplicó (~19s vs 6.3s) y aparecieron fallos de conexión (10%). Con 4 instancias enviando 40 peticiones en total al mismo tiempo, el servidor Node.js (single-threaded) las encola todas. Las peticiones al final de la cola esperan hasta ~38s antes de ser atendidas, y algunas agotaron el timeout del cliente (ECONNRESET). Esto demuestra que el escalamiento vertical no resuelve el problema de concurrencia para este escenario.

### Parte 2 - Escalabilidad horizontal

#### Crear el Balanceador de Carga

Antes de continuar puede eliminar el grupo de recursos anterior para evitar gastos adicionales y realizar la actividad en un grupo de recursos totalmente limpio.

1. El Balanceador de Carga es un recurso fundamental para habilitar la escalabilidad horizontal de nuestro sistema, por eso en este paso cree un balanceador de carga dentro de Azure tal cual como se muestra en la imágen adjunta.

![](images/part2/part2-lb-create.png)

2. A continuación cree un *Backend Pool*, guiese con la siguiente imágen.

![](images/part2/part2-lb-bp-create.png)

3. A continuación cree un *Health Probe*, guiese con la siguiente imágen.

![](images/part2/part2-lb-hp-create.png)

4. A continuación cree un *Load Balancing Rule*, guiese con la siguiente imágen.

![](images/part2/part2-lb-lbr-create.png)

5. Cree una *Virtual Network* dentro del grupo de recursos, guiese con la siguiente imágen.

![](images/part2/part2-vn-create.png)

#### Crear las maquinas virtuales (Nodos)

Ahora vamos a crear 3 VMs (VM1, VM2 y VM3) con direcciones IP públicas standar en 3 diferentes zonas de disponibilidad. Después las agregaremos al balanceador de carga.

1. En la configuración básica de la VM guíese por la siguiente imágen. Es importante que se fije en la "Avaiability Zone", donde la VM1 será 1, la VM2 será 2 y la VM3 será 3.

![](images/part2/part2-vm-create1.png)

2. En la configuración de networking, verifique que se ha seleccionado la *Virtual Network*  y la *Subnet* creadas anteriormente. Adicionalmente asigne una IP pública y no olvide habilitar la redundancia de zona.

![](images/part2/part2-vm-create2.png)

3. Para el Network Security Group seleccione "avanzado" y realice la siguiente configuración. No olvide crear un *Inbound Rule*, en el cual habilite el tráfico por el puerto 3000. Cuando cree la VM2 y la VM3, no necesita volver a crear el *Network Security Group*, sino que puede seleccionar el anteriormente creado.

![](images/part2/part2-vm-create3.png)

4. Ahora asignaremos esta VM a nuestro balanceador de carga, para ello siga la configuración de la siguiente imágen.

![](images/part2/part2-vm-create4.png)

5. Finalmente debemos instalar la aplicación de Fibonacci en la VM. para ello puede ejecutar el conjunto de los siguientes comandos, cambiando el nombre de la VM por el correcto

```
git clone https://github.com/daprieto1/ARSW_LOAD-BALANCING_AZURE.git

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
source /home/vm1/.bashrc
nvm install node

cd ARSW_LOAD-BALANCING_AZURE/FibonacciApp
npm install

npm install forever -g
forever start FibonacciApp.js
```

Realice este proceso para las 3 VMs, por ahora lo haremos a mano una por una, sin embargo es importante que usted sepa que existen herramientas para aumatizar este proceso, entre ellas encontramos Azure Resource Manager, OsDisk Images, Terraform con Vagrant y Paker, Puppet, Ansible entre otras.

#### Probar el resultado final de nuestra infraestructura

1. Porsupuesto el endpoint de acceso a nuestro sistema será la IP pública del balanceador de carga, primero verifiquemos que los servicios básicos están funcionando, consuma los siguientes recursos:

```
http://52.155.223.248/
http://52.155.223.248/fibonacci/1
```

2. Realice las pruebas de carga con `newman` que se realizaron en la parte 1 y haga un informe comparativo donde contraste: tiempos de respuesta, cantidad de peticiones respondidas con éxito, costos de las 2 infraestrucruras, es decir, la que desarrollamos con balanceo de carga horizontal y la que se hizo con una maquina virtual escalada.

3. Agregue una 4 maquina virtual y realice las pruebas de newman, pero esta vez no lance 2 peticiones en paralelo, sino que incrementelo a 4. Haga un informe donde presente el comportamiento de la CPU de las 4 VM y explique porque la tasa de éxito de las peticiones aumento con este estilo de escalabilidad.

```
newman run ARSW_LOAD-BALANCING_AZURE.postman_collection.json -e [ARSW_LOAD-BALANCING_AZURE].postman_environment.json -n 10 &
newman run ARSW_LOAD-BALANCING_AZURE.postman_collection.json -e [ARSW_LOAD-BALANCING_AZURE].postman_environment.json -n 10 &
newman run ARSW_LOAD-BALANCING_AZURE.postman_collection.json -e [ARSW_LOAD-BALANCING_AZURE].postman_environment.json -n 10 &
newman run ARSW_LOAD-BALANCING_AZURE.postman_collection.json -e [ARSW_LOAD-BALANCING_AZURE].postman_environment.json -n 10
```

**Preguntas**

* ¿Cuáles son los tipos de balanceadores de carga en Azure y en qué se diferencian?, ¿Qué es SKU, qué tipos hay y en qué se diferencian?, ¿Por qué el balanceador de carga necesita una IP pública?
* ¿Cuál es el propósito del *Backend Pool*?
* ¿Cuál es el propósito del *Health Probe*?
* ¿Cuál es el propósito de la *Load Balancing Rule*? ¿Qué tipos de sesión persistente existen, por qué esto es importante y cómo puede afectar la escalabilidad del sistema?.
* ¿Qué es una *Virtual Network*? ¿Qué es una *Subnet*? ¿Para qué sirven los *address space* y *address range*?
* ¿Qué son las *Availability Zone* y por qué seleccionamos 3 diferentes zonas?. ¿Qué significa que una IP sea *zone-redundant*?
* ¿Cuál es el propósito del *Network Security Group*?
* Informe de newman 1 (Punto 2)
* Presente el Diagrama de Despliegue de la solución.




