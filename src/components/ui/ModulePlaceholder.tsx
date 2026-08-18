import { PageHeader } from './PageHeader';
export function ModulePlaceholder({ title }: {
    title: string;
}) { return <>
<PageHeader title={title} subtitle={`Manage SmartSchool ${title.toLowerCase()} from one place.`}/>
<section className="card placeholder">
<div>
<h2>{title}</h2>
<p className="muted">Feature module is isolated and ready for its own API, components, routes and business workflows.</p>
<button className="primary">Quick Action</button>
</div>
</section>
</>; }

