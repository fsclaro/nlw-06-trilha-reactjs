import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

import { Button } from '../components/Button'
import { RoomCode } from '../components/RoomCode'
import { useAuth } from '../hooks/useAuth'
import { database } from '../services/firebase'

import logoImg from '../assets/images/logo.svg'

import '../styles/room.scss'

type RoomParams = {
  id: string
}

type FirebaseQuestions = Record<string, {
  content: string
  author: {
    name: string
    avatar: string
  }
  isHighlighted: boolean
  isAnswered: boolean
}>

type Questions = {
  id: string
  content: string
  author: {
    name: string
    avatar: string
  }
  isHighlighted: boolean
  isAnswered: boolean
}

export function Room() {
  const params = useParams<RoomParams>()
  const roomId = params.id
  const [newQuestion, setNewQuestion] = useState('')
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Questions[]>([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    const roomRef = database.ref(`rooms/${roomId}`)

    roomRef.on('value', room => {
      const databaseRoom = room.val()
      const firebaseQuestions: FirebaseQuestions = databaseRoom.questions

      const parsedQuestions = Object.entries(firebaseQuestions ?? {}).map(([key, value]) => {
        return {
          id: key,
          content: value.content,
          author: value.author,
          isHighlighted: value.isHighlighted,
          isAnswered: value.isAnswered
        }
      })

      setQuestions(parsedQuestions)
      setTitle(databaseRoom.title)

     })
  }, [roomId])

  async function handleSendQuestion(event: FormEvent) {
    event.preventDefault()

    if (newQuestion.trim() === '') {
      toast.error('Você não digitou uma questão.')
      return
    }

    if (!user) {
      toast.error('Você não está logado ainda.')
      throw new Error('Você não está logado ainda.')
    }

    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar
      },
      isHighlighted: false,
      isAnswered: false
    }

    await database.ref(`rooms/${roomId}/questions`).push(question)
    toast.success('Pergunta salva com sucesso.')

    setNewQuestion('')
  }

  return (
    <div id="page-room">
      <header>
        <div className="content">
          <img src={logoImg} alt="Letmeask" />
          <RoomCode code={roomId} />
        </div>
      </header>

      <main className="content">
        <div className="room-title">
          <h1>Sala {title}</h1>
          {questions.length > 0 && <span>{questions.length } pergunta(s)</span>}
        </div>

        <form onSubmit={handleSendQuestion}>
          <textarea
            placeholder="O que você quer perguntar?"
            onChange={(event) => setNewQuestion(event.target.value)}
            value={newQuestion}
          />
          <div className="form-footer">
            {user ? (
              <div className="user-info">
                <img src={user.avatar} alt={user.name} />
                <span>{user.name }</span>
              </div>
            ): (
              <span>
                Para enviar uma pergunta, <button>faça seu login</button>.
              </span>
            )}
            <Button type="submit">Enviar pergunta</Button>
          </div>
          <Toaster />
        </form>
        { JSON.stringify(questions)}
      </main>
    </div>
  )
}
