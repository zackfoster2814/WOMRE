import Race from 'src/abstract/interfaces/race.interface'

export type Subrace = Required<Omit<Race, 'description'>>
