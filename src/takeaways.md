# Notes on Execution

## Iteration 1

- When working in parallel, it sometimes fucks up larger tasks, like authentication, since they are entire systems
- It didn't connect stuff to the database.
- It made buttons on screens that weren't requested

### Solution

- Make supabase with auth
- More concretely define screens

## Iteration 2

- Links break, since the paths they generate don't necessarily exist yet
- Authentication is a nightmare
- Supabase requests don't reference schema correctly

### Solution

- Create supabase client with database reference. Run supabase link first and download the db first, and then create client with supabase type
- Include links on screen's description field. Include the API endpoints as references for filling out the data.
- First step should be setting up user context in right place
- Include supabase schema for screens so they can reference things correctly
