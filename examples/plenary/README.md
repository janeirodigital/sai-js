## Vocabs

* [Schema.org](https://schema.org)
  * [Event](https://schema.org/Event)
  * [Role](https://schema.org/Role)
* [Organization Activity ontology](https://innoweb.mondragon.edu/ontologies/dabgeo/domain-task/application_type/organization_energy_assessment/organizationactivity/1.0/index.html) 
  * [Chair](https://innoweb.mondragon.edu/ontologies/dabgeo/domain-task/application_type/organization_energy_assessment/organizationactivity/1.0/index.html#http://ontologies.smile.deri.ie/pdo#Chair)
  * [Scribe](https://innoweb.mondragon.edu/ontologies/dabgeo/domain-task/application_type/organization_energy_assessment/organizationactivity/1.0/index.html#http://ontologies.smile.deri.ie/pdo#Scribe)
  * [Attendee](https://innoweb.mondragon.edu/ontologies/dabgeo/domain-task/application_type/organization_energy_assessment/organizationactivity/1.0/index.html#http://ontologies.smile.deri.ie/pdo#Attendee)
  * [Absentee](https://innoweb.mondragon.edu/ontologies/dabgeo/domain-task/application_type/organization_energy_assessment/organizationactivity/1.0/index.html#http://ontologies.smile.deri.ie/pdo#Absentee)

## Shapes

* [Event](https://github.com/janeirodigital/sai-js/blob/main/packages/css-storage-fixture/shapetrees/shapes/Event%24.shex)
* [Role](https://github.com/janeirodigital/sai-js/blob/main/packages/css-storage-fixture/shapetrees/shapes/Role%24.shex)

## Trees

* [Event](https://github.com/janeirodigital/sai-js/blob/main/packages/css-storage-fixture/shapetrees/trees/Event%24.ttl)
* [Role](https://github.com/janeirodigital/sai-js/blob/main/packages/css-storage-fixture/shapetrees/trees/Role%24.ttl)


## Requirements

* Only CG chairs can create a new event
* Only CG chairs can add/remove the meeting chair
* Only the meeting chair can promote the attendee to a scribe
* Only CG participants can add themselves as attendee or absentee
* Each person can only have one role in a meeting
