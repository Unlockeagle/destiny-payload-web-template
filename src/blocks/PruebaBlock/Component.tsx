import { getPayload } from 'payload'
import config from '@payload-config'
import { VectorComponent } from '@/components/Backgorund/Vector-component'

type PruebaBlockType = {
	title: 'string'
	subTitle: 'string'
}
export const PruebaBlockComponent = async ({
	title,
	subTitle,
}: PruebaBlockType) => {
	//* se usa para trae data desde otras colecciones
	//*👉 const payload = await getPayload({config})

	return (
		<div className="relative container max-w-2xl mx-auto h-screen">
			<h1>{title}</h1>
			<h2>{subTitle}</h2>
			<VectorComponent />
		</div>
	)
}
