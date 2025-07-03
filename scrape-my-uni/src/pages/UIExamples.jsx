import React from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import '../styles/ui-enhancements.css';

const UIExamples = () => {
  return (
    <div className="container-fluid-custom">
      <h1 className="text-primary-custom mb-4">UI Component Examples</h1>
      
      {/* Cards Section */}
      <section className="mb-5">
        <h2 className="mb-3">Cards</h2>
        <div className="card-grid">
          {/* Simple Card */}
          <Card 
            title="Simple Card" 
            subtitle="Basic card with minimal content"
          >
            <p>This is a basic card with just some text content. Cards are versatile containers for displaying content.</p>
            <Button>Learn More</Button>
          </Card>
          
          {/* Card with Image */}
          <Card
            title="Card with Image"
            imageSrc="https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80"
          >
            <p>This card includes an image at the top. Images make cards more engaging and informative.</p>
            <div className="d-flex gap-2">
              <Badge>Featured</Badge>
              <Badge variant="success">New</Badge>
            </div>
          </Card>
          
          {/* Card with Footer */}
          <Card
            title="Card with Footer"
            footer={
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-secondary-custom">Last updated 3 mins ago</small>
                <Button variant="outline" size="sm">View</Button>
              </div>
            }
          >
            <p>This card has a footer section which can contain additional information or actions.</p>
            <p>Footers are great for timestamps, buttons, or other secondary content.</p>
          </Card>
        </div>
      </section>
      
      {/* Buttons Section */}
      <section className="mb-5">
        <h2 className="mb-3">Buttons</h2>
        <div className="d-flex flex-wrap gap-3">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button disabled>Disabled Button</Button>
        </div>
      </section>
      
      {/* Badges Section */}
      <section className="mb-5">
        <h2 className="mb-3">Badges</h2>
        <div className="d-flex flex-wrap gap-3">
          <Badge>Primary Badge</Badge>
          <Badge variant="secondary">Secondary Badge</Badge>
          <Badge variant="success">Success Badge</Badge>
          <Badge variant="warning">Warning Badge</Badge>
        </div>
      </section>
      
      {/* Grid Cards */}
      <section className="mb-5">
        <h2 className="mb-3">Course Cards</h2>
        <div className="card-grid">
          {[1, 2, 3, 4].map((item) => (
            <Card 
              key={item}
              className="fade-in"
              imageSrc={`https://picsum.photos/seed/${item}/500/300`}
              title={`Course Title ${item}`}
              subtitle="Department Name"
            >
              <div className="mb-3">
                <Badge variant="primary">4 Credits</Badge>
                <Badge variant="success" className="ms-2">Fall 2023</Badge>
              </div>
              <p>This course covers important topics in this field with practical examples and projects.</p>
              <Button variant="primary">Enroll Now</Button>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Avatar Example */}
      <section className="mb-5">
        <h2 className="mb-3">Avatars</h2>
        <div className="d-flex align-items-center gap-3">
          <img 
            src="https://i.pravatar.cc/150?img=1" 
            alt="User 1" 
            className="avatar" 
          />
          <img 
            src="https://i.pravatar.cc/150?img=2"
            alt="User 2" 
            className="avatar" 
          />
          <img 
            src="https://i.pravatar.cc/150?img=3" 
            alt="User 3" 
            className="avatar-lg" 
          />
        </div>
      </section>
      
      {/* List Group Example */}
      <section className="mb-5">
        <h2 className="mb-3">List Groups</h2>
        <div className="custom-list-group">
          <div className="custom-list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>History 101</strong>
              <div>Introduction to World History</div>
            </div>
            <Badge variant="primary">4 Credits</Badge>
          </div>
          <div className="custom-list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>Math 202</strong>
              <div>Advanced Calculus</div>
            </div>
            <Badge variant="secondary">3 Credits</Badge>
          </div>
          <div className="custom-list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>Computer Science 301</strong>
              <div>Data Structures and Algorithms</div>
            </div>
            <Badge variant="success">5 Credits</Badge>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UIExamples; 