import * as THREE from 'three'

import Environment from './Environment.js'
import Fox from './Fox.js'
import Robot from './Robot.js'
import ToyCarLoader from '../../loaders/ToyCarLoader.js'
import Floor from './Floor.js'
import ThirdPersonCamera from './ThirdPersonCamera.js'
import Sound from './Sound.js'
import AmbientSound from './AmbientSound.js'
import MobileControls from '../../controls/MobileControls.js'


export default class World {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Sonidos
        this.coinSound = new Sound('/sounds/coin.ogg')
        this.ambientSound = new AmbientSound('/sounds/ambiente.mp3')
        this.winner = new Sound('/sounds/winner.mp3')

        this.allowPrizePickup = false
        this.hasMoved = false
        this.targetPosition = null
        this.targetMarker = null

        // Event emitter
        this.events = {}

        // Permitimos recoger premios tras 2s
        setTimeout(() => {
            this.allowPrizePickup = true
            console.log('✅ Ahora se pueden recoger premios')
        }, 2000)

        // Cuando todo esté cargado...
        this.resources.on('ready', async () => {
            // 1️⃣ Mundo base
            this.floor = new Floor(this.experience)
            this.environment = new Environment(this.experience)

            this.loader = new ToyCarLoader(this.experience)
            await this.loader.loadFromAPI()

            // 2️⃣ Personajes
            this.fox = new Fox(this.experience)
            this.robot = new Robot(this.experience)


            this.experience.tracker.showCancelButton()
            //Registrando experiencia VR con el robot
            this.experience.vr.bindCharacter(this.robot)
            this.thirdPersonCamera = new ThirdPersonCamera(this.experience, this.robot.group)

            // 3️⃣ Cámara
            this.thirdPersonCamera = new ThirdPersonCamera(this.experience, this.robot.group)

            // 4️⃣ Controles móviles (tras crear robot)
            this.mobileControls = new MobileControls({
                onUp: (pressed) => { this.experience.keyboard.keys.up = pressed },
                onDown: (pressed) => { this.experience.keyboard.keys.down = pressed },
                onLeft: (pressed) => { this.experience.keyboard.keys.left = pressed },
                onRight: (pressed) => { this.experience.keyboard.keys.right = pressed }
            })


        })

    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = []
        }
        this.events[event].push(callback)
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data))
        }
    }

    toggleAudio() {
        this.ambientSound.toggle()
    }

    resetForChallenge(challenge) {
        // Reset game state
        this.points = 0
        this.robot.points = 0
        this.experience.menu.setStatus?.('🎮 Desafío iniciado')

        // Clear existing obstacles
        this.experience.raycaster?.removeAllObstacles()

        // Reset prize positions
        if (this.loader?.prizes) {
            this.loader.prizes.forEach(prize => {
                if (prize.pivot) {
                    this.scene.remove(prize.pivot)
                }
            })
            this.loader.prizes = []
        }

        // Setup challenge-specific elements
        switch (challenge.type) {
            case 'coins':
                this.setupCoinChallenge()
                break
            case 'avoidance':
                this.setupAvoidanceChallenge()
                break
            case 'speed':
                this.setupSpeedChallenge()
                break
        }
    }

    setupCoinChallenge() {
        // Generate coins in random positions
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 40 - 20
            const z = Math.random() * 40 - 20
            this.loader.addPrize(new THREE.Vector3(x, 0.5, z))
        }
    }

    setupAvoidanceChallenge() {
        // Generate more obstacles
        this.experience.obstacleWaveCount = 20
        this.experience._startObstacleWaves()
    }

    setupSpeedChallenge() {
        // Create target marker
        if (this.targetMarker) {
            this.scene.remove(this.targetMarker)
        }

        const geometry = new THREE.CylinderGeometry(1, 1, 0.1, 32)
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
        this.targetMarker = new THREE.Mesh(geometry, material)
        this.targetMarker.rotation.x = -Math.PI / 2
        this.scene.add(this.targetMarker)
    }

    setTargetPosition(position) {
        this.targetPosition = position
        if (this.targetMarker) {
            this.targetMarker.position.copy(position)
        }
    }

    update(delta) {
        // Actualiza personajes y cámara
        this.fox?.update()
        this.robot?.update()

        if (this.thirdPersonCamera && this.experience.isThirdPerson && !this.experience.renderer.instance.xr.isPresenting) {
            this.thirdPersonCamera.update()
        }

        // Gira premios
        this.loader?.prizes?.forEach(p => p.update(delta))


        // Lógica de recogida
        if (!this.allowPrizePickup || !this.loader || !this.robot) return

        const pos = this.robot.body.position
        const speed = this.robot.body.velocity.length()
        const moved = speed > 0.5

        this.loader.prizes.forEach((prize, idx) => {
            if (prize.collected || !prize.pivot) return

            const dist = prize.pivot.position.distanceTo(pos)
            if (dist < 1.2 && moved) {
                prize.collect()
                this.loader.prizes.splice(idx, 1)

                // ✅ Incrementar puntos
                this.points = (this.points || 0) + 1
                this.robot.points = this.points

                // 🧹 Limpiar obstáculos
                if (this.experience.raycaster?.removeRandomObstacles) {
                    const reduction = 0.2 + Math.random() * 0.1
                    this.experience.raycaster.removeRandomObstacles(reduction)
                }

                this.coinSound.play()
                this.experience.menu.setStatus?.(`💰 Monedas: ${this.points}`)
                this.emit('coinCollected')
            }
        })

        // Check for target reaching in speed challenge
        if (this.targetPosition && this.robot) {
            const dist = this.robot.body.position.distanceTo(this.targetPosition)
            if (dist < 2) {
                this.emit('targetReached')
            }
        }

        // Check for collisions in avoidance challenge
        if (this.robot && this.experience.physics) {
            const robotPos = this.robot.body.position
            const obstacles = this.experience.raycaster?.obstacles || []
            
            for (const obstacle of obstacles) {
                if (obstacle.body) {
                    const dist = robotPos.distanceTo(obstacle.body.position)
                    if (dist < 1.5) {
                        this.emit('collision')
                        break
                    }
                }
            }
        }

        // ✅ Evaluar fuera del bucle de premios
        if (this.points === 14 && !this.experience.tracker.finished) {
            const elapsed = this.experience.tracker.stop()
            this.experience.tracker.saveTime(elapsed)
            this.experience.tracker.showEndGameModal(elapsed)

            this.experience.obstacleWavesDisabled = true
            clearTimeout(this.experience.obstacleWaveTimeout)
            this.experience.raycaster?.removeAllObstacles()
            this.winner.play()
        }

    }

}
